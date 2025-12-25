import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  sw: "sw-custom.js",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/[^\/]+\/(?!api|_next\/static).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
          networkTimeoutSeconds: 10,
        },
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
    ],
  },
};

export default withPWA(nextConfig);
