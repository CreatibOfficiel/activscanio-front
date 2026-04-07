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
  images: {
    unoptimized: true,
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
    ],
  },
};

export default withPWA(nextConfig);
