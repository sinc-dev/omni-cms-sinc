import type { NextConfig } from "next";
import path from "node:path";

// Monorepo root (two levels up from /web) - where pnpm-lock.yaml lives
// From apps/web/next.config.ts -> apps/ -> monorepo root
const root = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  // Set outputFileTracingRoot to monorepo root
  // This ensures Next.js can find next/package.json and the lockfile
  outputFileTracingRoot: root,
  
  // Configure Turbopack for monorepo (Next.js 16 uses Turbopack by default)
  // Use absolute path to monorepo root where node_modules and pnpm-lock.yaml are
  turbopack: {
    root: root,
  },
  
  // 1. Disable Source Maps (Critical)
  productionBrowserSourceMaps: false,
  experimental: {
    serverSourceMaps: false,
  },

  // 2. Remove 'serverExternalPackages' 
  // Let Webpack bundle and tree-shake @aws-sdk/client-s3 naturally.
  
  // 3. Force Webpack to drop source maps entirely and improve pnpm resolution
  webpack: (config, { isServer }) => {
    config.devtool = false;
    
    // Improve module resolution for pnpm workspaces
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.symlinks = false;
      config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve(root, 'node_modules'),
      ];
    }
    
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