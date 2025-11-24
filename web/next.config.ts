import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (one level up from /web) - where pnpm-lock.yaml lives
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Set both outputFileTracingRoot and turbopack.root to the same monorepo root
  // This ensures Next.js can find next/package.json and the lockfile
  outputFileTracingRoot: root,
  
  // @ts-expect-error - 'turbopack' is valid in runtime but missing in current types
  turbopack: {
    root,
  },
  
  // 1. Disable Client Source Maps
  productionBrowserSourceMaps: false,
  
  // 2. Disable Server Source Maps
  experimental: {
    serverSourceMaps: false,
  },
  
  // 3. Use default output (Cloudflare handles tracing best this way)
  // output: 'standalone' - Keep this commented out or removed
  
  // 4. Force Webpack to drop source maps entirely (The Nuclear Option)
  webpack: (config) => {
    config.devtool = false;
    return config;
  },
  
  // Ignore linting/type errors during build
  // @ts-expect-error - 'eslint' is valid in runtime but missing in Next.js 16 types
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Image optimization for Cloudflare
  images: {
    unoptimized: true, // Recommended for Cloudflare unless using a paid image loader
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Configure appropriately for production
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key',
          },
        ],
      },
      {
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;