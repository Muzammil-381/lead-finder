import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Vercel build ke dauran TypeScript type errors ko ignore karega
    ignoreBuildErrors: true,
  },
  eslint: {
    // Build ke dauran ESLint warnings/errors ko ignore karega
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;