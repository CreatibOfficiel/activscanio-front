# syntax=docker/dockerfile:1

# MushroomBet frontend (Next.js 15 App Router, PWA).
#
# Build on the VPS (linux/amd64). Do not build locally on arm64 and push:
# `sharp` resolves a platform-specific native binary at install time and
# Next.js traces that binary into the standalone output.
#
# This is now load-bearing, not just a nice-to-have. next.config.ts enables
# image optimization (it used to set `unoptimized: true`), and the optimizer
# calls sharp on EVERY /_next/image request at runtime. Consequences:
#   - `sharp` must be in package.json `dependencies`, not devDependencies, or
#     the traced standalone bundle omits it and /_next/image 500s. It was in
#     devDependencies, which is the most likely reason optimization was
#     disabled in the first place.
#   - Building on arm64 traces @img/sharp-darwin-arm64 into the output; on
#     this alpine/amd64 base the correct package is @img/sharp-linuxmusl-x64.
#     A cross-arch build produces an image whose optimizer cannot start.
# .dockerignore excludes node_modules and .next precisely so the host's
# arm64 binaries can never leak in.
#
# ---------------------------------------------------------------------------
# NEXT_PUBLIC_* are INLINED INTO THE JS BUNDLE AT BUILD TIME.
# Passing them at runtime (compose `environment:`, `docker run -e`) does
# nothing at all. They must be ARG + ENV *before* `npm run build`, which is
# how they are wired below.
#
# CLERK_SECRET_KEY is the opposite: it is read by clerkMiddleware at request
# time and must NEVER be a build arg (it would be recoverable from the image
# history). Inject it at runtime with `-e CLERK_SECRET_KEY=...`. Verified:
# with it absent, the middleware throws and every page returns 500.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20-alpine


# --- deps: install dependencies only, so this layer caches on lockfile ------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# `npm ci` (not `npm install`): reproducible, honours package-lock.json, and
# fails loudly if the lockfile and package.json disagree.
#
# Full install including devDependencies is required: the build needs
# typescript, tailwind/postcss, and @ducanh2912/next-pwa, all of which live in
# devDependencies. The runner stage does not inherit any of this.
COPY package.json package-lock.json ./
RUN npm ci


# --- builder: compile the Next.js app --------------------------------------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public config. Empty defaults are deliberate: a missing value
# should surface as an obviously-broken URL rather than silently falling back
# to http://localhost:3001, which is what the old Dockerfile effectively did
# by declaring a variable name (NEXT_PUBLIC_API_BASE_URL) that appears nowhere
# in the source.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY} \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Fail early and loudly rather than shipping an image that points at
# localhost. These four are the only NEXT_PUBLIC_* vars the source actually
# reads (verified by grep over src/ and next.config.ts).
RUN set -eu; \
    missing=''; \
    for v in NEXT_PUBLIC_API_URL NEXT_PUBLIC_SOCKET_URL \
             NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY NEXT_PUBLIC_VAPID_PUBLIC_KEY; do \
      eval "val=\${$v-}"; \
      [ -n "$val" ] || missing="$missing $v"; \
    done; \
    if [ -n "$missing" ]; then \
      echo "ERROR: missing required build args:$missing" >&2; \
      echo "These are inlined at build time and cannot be set at runtime." >&2; \
      exit 1; \
    fi; \
    case "$NEXT_PUBLIC_API_URL" in \
      */api) : ;; \
      *) echo "ERROR: NEXT_PUBLIC_API_URL must end with /api (the NestJS API uses setGlobalPrefix('api')). Got: $NEXT_PUBLIC_API_URL" >&2; exit 1 ;; \
    esac; \
    case "$NEXT_PUBLIC_SOCKET_URL" in \
      */api|*/) echo "ERROR: NEXT_PUBLIC_SOCKET_URL must have no /api and no trailing slash (useSocket appends /events). Got: $NEXT_PUBLIC_SOCKET_URL" >&2; exit 1 ;; \
    esac

# `next build && node scripts/post-build-sw.js` (see package.json).
# The post-build step MUTATES public/: next-pwa emits public/sw-custom.js and
# public/workbox-*.js during `next build`, then post-build-sw.js strips a
# broken start-url route and appends the push/notificationclick handlers.
# Both generated files are gitignored. This is why the runner copies public/
# from THIS stage and never from the build context.
RUN npm run build


# --- runner: minimal production image --------------------------------------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# wget is used by the HEALTHCHECK below. curl is not present in node:alpine.
RUN apk add --no-cache wget

# `node` (uid 1000) already exists in the official image. Running as root was
# a defect in the previous Dockerfile.
USER node

# next.config.ts sets `output: "standalone"`, which emits a self-contained
# server.js plus only the node_modules Next traced as reachable. That replaces
# the old approach of copying the entire dev node_modules (1.8 GB here) into
# the runner; the standalone bundle measures ~81 MB.
#
# Standalone does NOT include public/ or .next/static — verified, both are
# absent from .next/standalone. They must be copied explicitly, or every
# static asset and the PWA service worker 404s.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

EXPOSE 3000

# /manifest.json, not a page route.
#
# The app has no health endpoint (src/app/api/ does not exist), and
# src/middleware.ts matches nearly everything, so page routes are unusable
# here: verified against the running standalone server, `/` returns 307 to
# /sign-in, and `/tv/display` — despite being in PUBLIC_ROUTE_MATCHERS —
# still runs clerkMiddleware and hangs when Clerk is unreachable.
#
# /manifest.json is a checked-in static file under public/ and is excluded
# from the middleware matcher by the `json` extension in its negative
# lookahead, so it is served straight off disk. Verified: returns 200 even
# with CLERK_SECRET_KEY entirely unset. It proves the server is up and
# serving without coupling container health to Clerk's availability.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider "http://127.0.0.1:${PORT}/manifest.json" || exit 1

# server.js is the standalone entrypoint. `npm run start` (next start) does
# not work against a standalone build and next/npm are not installed here.
CMD ["node", "server.js"]
