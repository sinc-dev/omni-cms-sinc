# Cloudflare Pages Build Optimization Guide

This document outlines the optimizations and configuration required to prevent build timeouts on Cloudflare Pages.

## Problem

Cloudflare Pages has a **20-minute build timeout**. The build was timing out due to:
1. Double build execution (running `next build` twice)
2. Monorepo overhead (installing dependencies for all workspaces)
3. Missing build optimizations

## Solution

### 1. Cloudflare Pages Dashboard Configuration

#### Root Directory
- **Setting**: Settings → Builds & deployments → Root directory
- **Value**: `web`
- **Why**: Ensures only the `web` workspace is built, not the entire monorepo

#### Build Command
- **Setting**: Settings → Builds & deployments → Build command
- **Value**: `pnpm build`
- **Why**: Uses the optimized build script that prevents double builds

#### Build Output Directory
- **Setting**: Settings → Builds & deployments → Build output directory
- **Value**: `.vercel/output/static` (or leave empty for auto-detection)
- **Why**: This is where `@cloudflare/next-on-pages` outputs the build

#### Build Caching
- **Setting**: Settings → Build → Build cache
- **Value**: **Enabled** (critical!)
- **Why**: Caches `node_modules` between builds, reducing install time from 20+ minutes to 2-5 minutes

### 2. Environment Variables

#### Required Environment Variable
- **Variable name**: `TURBOPACK`
- **Value**: `0`
- **Environment**: Production (and Preview if needed)
- **Why**: Disables Turbopack (which is incompatible with `@cloudflare/next-on-pages`) and forces webpack usage

#### Location
Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

### 3. Build Script Optimization

The build script (`scripts/build.mjs`) has been optimized to eliminate double builds:

**Previous behavior** (caused timeout):
1. Run `next build` (~10-15 min)
2. Run `@cloudflare/next-on-pages` which calls `pnpm run build` again (~10-15 min)
3. Total: 20-30 minutes → **TIMEOUT**

**New behavior** (optimized):
1. If called directly: Run adapter only (adapter handles the build)
2. If called from adapter: Run `next build` only
3. Total: ~10-15 minutes → **SUCCESS**

### 4. Node.js Version

The `.node-version` file specifies Node.js 22 to ensure consistent builds and avoid version detection overhead.

### 5. pnpm Configuration

The `.npmrc` file includes optimizations:
- `shamefully-hoist=true` - Flattens dependency tree
- `prefer-offline=true` - Uses cached packages
- `side-effects-cache=true` - Caches side-effect results
- `node-linker=hoisted` - Faster hoisted linker

## Verification Checklist

Before deploying, verify:

- [ ] Root directory is set to `web` in Cloudflare Pages settings
- [ ] Build command is `pnpm build` (not `pnpm install && pnpm build`)
- [ ] Build caching is **enabled** in Cloudflare Pages settings
- [ ] `TURBOPACK=0` environment variable is set in Cloudflare Pages dashboard
- [ ] `.node-version` file exists with Node.js version (22)
- [ ] `.npmrc` file exists with optimizations
- [ ] Build script (`scripts/build.mjs`) uses the optimized logic

## Expected Build Times

After optimization:
- **Dependency installation**: 2-5 minutes (with cache) or 30-40 seconds (warm cache)
- **Next.js build**: 2-4 minutes
- **Adapter processing**: 1-2 minutes
- **Total**: 5-11 minutes (well under 20-minute limit)

## Troubleshooting

### Build Still Timing Out

1. **Check build logs** - Identify which step is slow
2. **Verify build caching** - Ensure it's enabled and working
3. **Check root directory** - Must be `web`, not repo root
4. **Verify environment variables** - `TURBOPACK=0` must be set
5. **Test locally** - Run `pnpm install --frozen-lockfile && pnpm build` to measure time

### Build Fails with Turbopack Error

- Ensure `TURBOPACK=0` is set in Cloudflare Pages environment variables
- Verify the build script sets `TURBOPACK=0` in the environment
- Check build logs for "Next.js 16.0.3 (Turbopack)" - should show without "(Turbopack)"

### Monorepo Installing All Workspaces

- Verify root directory is set to `web` in Cloudflare Pages settings
- Check `pnpm-workspace.yaml` only includes `web`
- Ensure build command doesn't use `--filter` unnecessarily

## Additional Resources

- [Cloudflare Pages Build Caching](https://developers.cloudflare.com/pages/configuration/build-caching/)
- [Cloudflare Pages Build Limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)
- [@cloudflare/next-on-pages Documentation](https://github.com/cloudflare/next-on-pages)

