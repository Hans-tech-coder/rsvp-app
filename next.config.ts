import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.3.62'],
  serverExternalPackages: ["firebase-admin"],
  async rewrites() {
    return {
      // Admin draft preview: /<eventId>?preview=<token> renders src/app/[event]/preview
      // (per request, admins only) instead of the cached live page. The query is kept.
      beforeFiles: [
        { source: '/:event', has: [{ type: 'query', key: 'preview' }], destination: '/:event/preview' },
      ],
    };
  },
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
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
