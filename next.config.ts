import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.62'],
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};

export default nextConfig;
