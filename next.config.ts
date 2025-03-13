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
        // Le `/**` autorise n'importe quel chemin 
      },
    ],
  },
};

export default nextConfig;
