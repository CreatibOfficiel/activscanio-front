# Dockerfile
# Use the official Node.js 18 image
FROM node:20-alpine AS builder

WORKDIR /app

# Declare the build argument
ARG NEXT_PUBLIC_API_BASE_URL

# Next.js will be able to access it (via process.env)
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Copy the package files and install
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Build the Next.js project
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]
