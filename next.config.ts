import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "sw-custom.js",
  cacheStartUrl: false,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      // Pages (HTML / Next.js routes): always go to the network.
      // We previously cached pages with NetworkFirst, but that caused
      // workbox `no-response` errors on slow Railway cold-starts when
      // the cache was empty. The app does not need offline page support
      // (static assets below are still cached for PWA install + perf).
      {
        urlPattern: /^https?:\/\/[^\/]+\/(?!api|_next\/static).*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https?:.*\.(png|jpg|jpeg|webp|svg|gif|js|css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 2592000 },
        },
      },
      {
        urlPattern: /^https?:.*\.(woff|woff2|ttf|otf)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "font-cache",
          expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
        },
      },
      {
        urlPattern: /^https:\/\/cdn\.prod\.website-files\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-images-cache",
          expiration: { maxEntries: 100, maxAgeSeconds: 604800 },
        },
      },
      {
        urlPattern: /^https?:\/\/[^\/]+\/api\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Emits `.next/standalone` with a self-contained server.js and only the
  // node_modules actually traced as reachable. Lets the Docker runner stage
  // skip shipping the full dependency tree.
  //
  // Standalone does NOT copy `public/` or `.next/static` into the output —
  // the Dockerfile copies both explicitly from the builder stage. `public/`
  // in particular must come from the builder, never the build context:
  // next-pwa writes `sw-custom.js` / `workbox-*.js` there during the build
  // and `scripts/post-build-sw.js` mutates it afterwards.
  output: "standalone",
  images: {
    // Optimization is ON. It was previously disabled (`unoptimized: true`),
    // which made every <Image> serve the original bytes: a 3.3 MB 3024x4032
    // phone photo was being downloaded to fill a 38x38 avatar.
    //
    // The optimizer needs `sharp` AT RUNTIME. Next resolves it from
    // node_modules inside the standalone output, so `sharp` MUST stay in
    // `dependencies` (not devDependencies) or the runner stage 500s on
    // /_next/image. See package.json and the Dockerfile deps stage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
      // Uploaded profile pictures and duel proofs. The API serves them at
      // /images/... on the SAME host as the web app (nginx routes /images/
      // to the API container), but PUBLIC_IMAGE_URL stores them as absolute
      // https:// URLs, so Next still requires an explicit allow-list entry.
      {
        protocol: "https",
        hostname: "azule.ascan.io",
        port: "",
        pathname: "/images/**",
      },
      // Local development: the API serves images off its own port.
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/images/**",
      },
    ],
    // Uploads are normalized to WebP server-side (see the API's
    // ImageProcessingService); AVIF on top of that buys little and costs
    // noticeably more CPU per variant on a single VPS.
    formats: ["image/webp"],
    // Avatars dominate this app: 28-80 CSS px, so 32/48/64/96/128 cover
    // 1x-3x DPR without generating a long tail of unused variants.
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 2592000,
  },
};

export default withPWA(nextConfig);
