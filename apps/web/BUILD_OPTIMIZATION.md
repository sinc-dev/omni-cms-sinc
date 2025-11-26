# Build Memory Optimization Guide

## Problem
The build process is running out of memory during the `vercel build` step, even with 4GB heap size. This is happening because:
1. The codebase has grown significantly
2. `vercel build` processes all routes and generates static pages
3. Webpack compilation uses significant memory
4. Large dependencies (Radix UI, TipTap, Recharts) increase bundle size

## Optimizations Applied

### 1. Next.js Configuration (`next.config.ts`)

#### Memory Reduction:
- **Disabled source maps**: `productionBrowserSourceMaps: false` - Saves significant memory
- **Optimized chunk splitting**: Split large vendor libraries separately
- **Tree shaking enabled**: `usedExports: true` - Remove unused code
- **Externalized server packages**: Large AWS SDK packages externalized on server

#### Build Output:
- **Standalone output**: `output: 'standalone'` - Reduces output size

### 2. Webpack Optimizations

#### Chunk Splitting Strategy:
- Split vendor chunks for large libraries (50KB+)
- Prevents loading all dependencies at once
- Reduces peak memory during compilation

#### Memory-Efficient Settings:
- Deterministic module IDs
- Optimized tree shaking
- Externalized large server-side packages

### 3. Code-Level Optimizations (Recommended)

#### A. Optimize Icon Imports
Replace barrel imports with individual imports:

```typescript
// ❌ BAD - imports entire library
import { Home, Settings, User } from 'lucide-react';

// ✅ GOOD - imports only needed icons
import Home from 'lucide-react/dist/esm/icons/home';
// OR use next/dynamic for large icons
const UserIcon = dynamic(() => import('lucide-react').then(mod => ({ default: mod.User })));
```

#### B. Dynamic Imports for Heavy Components
Lazy load heavy components:

```typescript
// ❌ BAD - loads everything upfront
import { RechartsGraph } from '@/components/recharts-graph';

// ✅ GOOD - lazy load when needed
const RechartsGraph = dynamic(() => import('@/components/recharts-graph'), {
  loading: () => <Skeleton />,
  ssr: false, // If it's client-only
});
```

#### C. Reduce Static Page Generation
For dynamic routes, limit static generation:

```typescript
// In [orgId]/posts/[id]/page.tsx
export const dynamicParams = true; // Allow dynamic params
export const revalidate = 3600; // Revalidate every hour

// Or disable static generation for heavy pages
export const dynamic = 'force-dynamic';
```

#### D. Optimize Heavy Dependencies
1. **TipTap Editor**: Only import extensions you use
2. **Recharts**: Use dynamic imports if not critical for SSR
3. **Radix UI**: Already optimized, but avoid importing unused components

### 4. Build Process Optimizations

#### Reduce Workers During Build
Modify build command to use fewer workers:

```json
{
  "build:cf": "NODE_OPTIONS='--max-old-space-size=4096 --max_old_space_size=4096' NEXT_PRIVATE_WORKERS=4 next build --webpack && node scripts/build-cf.js"
}
```

**Note**: `NEXT_PRIVATE_WORKERS=4` reduces parallel workers from default (7) to 4, lowering peak memory usage.

#### ✅ SWC is Now Default
SWC is faster and uses less memory than Webpack. We've switched to SWC by default:

```json
{
  "build": "NODE_OPTIONS='--max-old-space-size=4096' NEXT_PRIVATE_WORKERS=4 next build",
  "build:cf": "NODE_OPTIONS='--max-old-space-size=4096' NEXT_PRIVATE_WORKERS=4 next build && node scripts/build-cf.js"
}
```

**Benefits of SWC:**
- **20x faster** compilation than webpack
- **50-70% lower memory usage** during build
- Better tree shaking and optimization
- Native Rust-based compiler (no JavaScript overhead)

To use webpack (if needed for compatibility):
```json
{
  "build:webpack": "NODE_OPTIONS='--max-old-space-size=4096' NEXT_PRIVATE_WORKERS=4 next build --webpack && node scripts/build-cf.js"
}
```

### 5. Dependency Optimization

#### Audit Large Dependencies
Check bundle size impact:

```bash
cd apps/web
pnpm add -D @next/bundle-analyzer
```

Update `next.config.ts`:

```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run: `pnpm analyze` to see what's taking up space.

### 6. Vercel Build Optimizations

The `vercel build` step (inside `@cloudflare/next-on-pages`) is memory-intensive. To reduce this:

1. **Reduce static routes**: Make more routes dynamic
2. **Optimize output size**: Already done with `output: 'standalone'`
3. **Split builds**: Not possible with current setup, but could split frontend/backend

## Immediate Actions

1. ✅ **Done**: Optimized `next.config.ts` with memory-efficient settings
2. ✅ **Done**: Added webpack chunk splitting
3. ⚠️ **Recommended**: Switch from webpack to SWC (remove `--webpack` flag)
4. ⚠️ **Recommended**: Reduce Next.js workers to 4 during build
5. ⚠️ **Recommended**: Optimize icon imports (lazy load or individual imports)
6. ⚠️ **Recommended**: Use dynamic imports for heavy components (Recharts, TipTap extensions)

## Testing

After applying optimizations:

1. Test build locally:
   ```bash
   cd apps/web
   NODE_OPTIONS='--max-old-space-size=4096' pnpm build:cf
   ```

2. Monitor memory usage:
   ```bash
   # On Linux/Mac
   NODE_OPTIONS='--max-old-space-size=4096' next build --webpack
   # Watch memory with: top or htop
   ```

3. Check bundle size:
   ```bash
   pnpm analyze
   ```

## Expected Results

- **Memory reduction**: 20-30% less memory usage during build
- **Faster builds**: SWC is 20x faster than webpack
- **Smaller bundles**: Better tree shaking and code splitting
- **Lower peak memory**: Reduced workers and optimized chunking

## If Still Having Issues

1. **Further reduce workers**: `NEXT_PRIVATE_WORKERS=2`
2. **Make more routes dynamic**: Reduce static generation
3. **Split application**: Separate heavy features into separate deployments
4. **Contact Cloudflare**: Request higher memory limits for Pages builds
5. **Use Cloudflare Workers**: Deploy API separately as Workers (different limits)
