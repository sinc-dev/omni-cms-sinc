import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (one level up from /web) - where pnpm-lock.yaml lives
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Set both outputFileTracingRoot and turbopack.root to the same monorepo root
  // This ensures Next.js can find next/package.json and the lockfile
  outputFileTracingRoot: root,
  
  turbopack: {
    root,
  },
  
  // 1. Disable Source Maps (Critical)
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
  },

  // 2. Remove 'serverExternalPackages' 
  // Let Webpack bundle and tree-shake @aws-sdk/client-s3 naturally.
  
  // 3. Force Webpack to drop source maps entirely
  webpack: (config) => {
    config.devtool = false;
    return config;
  },
  
  // Enable compression for build artifacts
  compress: true,
  
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