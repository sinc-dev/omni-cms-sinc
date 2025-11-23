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
  // Ensure 'output' is NOT set to 'export' or 'standalone'
  // @cloudflare/next-on-pages expects the standard default output to process
  // output: 'standalone', // <--- DO NOT USE THIS
  // output: 'export',    // <--- DO NOT USE THIS
  
  // 👇 CRITICAL: Disable source maps to drastically reduce bundle size (50-70% reduction)
  // 1. Disable Client Source Maps
  productionBrowserSourceMaps: false,
  
  // 2. Disable Server Source Maps (Crucial for Cloudflare)
  // This is the key fix - server source maps are what's causing the 64MB bundle
  experimental: {
    serverSourceMaps: false,
    // Reduce bundle size by optimizing server components
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  
  // 3. Force Webpack to drop source maps entirely (brute force approach)
  webpack: (config, { isServer }) => {
    // Disable all source maps
    config.devtool = false;
    
    if (isServer) {
      // Optimize server bundle
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
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
