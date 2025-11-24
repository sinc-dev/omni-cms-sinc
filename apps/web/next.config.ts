import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (one level up from /web) - where pnpm-lock.yaml lives
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // Set outputFileTracingRoot to monorepo root
  // This ensures Next.js can find next/package.json and the lockfile
  outputFileTracingRoot: root,
  
  // Configure Turbopack for monorepo (Next.js 16 uses Turbopack by default)
  turbopack: {
    root: root, // Point to monorepo root where next/package.json is
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
  
  // Note: eslint config removed - Next.js 16 doesn't support it in next.config.ts
  // Use .eslintrc.json or eslint.config.js instead
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