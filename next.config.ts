import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
        port: "",
        pathname: "/**", 
        // The `/**` allows any path
        // Exemple : https://cdn.prod.website-files.com/mon-image.png
      },
    ],
  },
};

export default nextConfig;
