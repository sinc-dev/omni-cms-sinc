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
  
  // 👇 CRITICAL: Disable source maps to drastically reduce bundle size
  productionBrowserSourceMaps: false,
  
  experimental: {
    serverSourceMaps: false,
  },
  
  // ❌ REMOVED: output: 'standalone' - causes code duplication issues with Cloudflare
  // Standard output allows next-on-pages to trace dependencies more accurately
  
  // 👇 CRITICAL: Force tree-shaking for Lucide icons to prevent 10MB+ duplication
  // This ensures only the exact icons used are bundled, not the entire library
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{lowerCase camelCase member}}',
      skipDefaultConversion: true,
    },
  },
  
  // Force Webpack to drop source maps entirely
  webpack: (config) => {
    config.devtool = false;
    return config;
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
