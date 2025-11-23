# Cloudflare Pages Build Configuration

## Current Setup

The project uses `@cloudflare/next-on-pages` adapter to deploy Next.js to Cloudflare Pages.

## ⚠️ CRITICAL: Build Command Configuration

### **MUST USE: `pnpm run build:cf`**

**DO NOT use**: `npx @cloudflare/next-on-pages@1` or `npx @cloudflare/next-on-pages` directly.

**Why**: Using the direct adapter command bypasses the `build:cf` script that uses `--skip-build` to avoid the `web/web/.next` path issue. The adapter still runs `vercel build` internally, causing the same path construction error.

## Cloudflare Pages Dashboard Settings

### Root Directory = `web` (Current Configuration)

**Root Directory**: `web`

**Build Command**: 
```bash
pnpm run build:cf
```

**⚠️ IMPORTANT**: This is the **ONLY** correct build command. Do not use `npx @cloudflare/next-on-pages@1` directly.

**How it works**:
1. The `build:cf` script runs `TURBOPACK=0 next build` first, creating `.next` in the correct location (`/opt/buildhome/repo/web/.next`)
2. Then it runs `TURBOPACK=0 npx @cloudflare/next-on-pages --skip-build` to process the existing `.next` output
3. The `--skip-build` flag prevents the adapter from running `vercel build` internally, which would incorrectly construct the `web/web/.next` path

**Build Output Directory**: Leave empty (auto-detected from `wrangler.toml`)

**Why this configuration works**:
- When root directory is `web`, Cloudflare Pages runs commands from `/opt/buildhome/repo/web`
- The `build:cf` script runs `next build` first, creating `.next` in the correct location
- Then the adapter processes the output with `--skip-build`, avoiding the problematic `vercel build` step
- The adapter automatically detects `package.json`, `next.config.ts`, and `wrangler.toml` in the current directory
- `wrangler.toml` is found because it's in the same directory where the adapter runs

**Note**: The `--project-dir` flag is **not supported** by `@cloudflare/next-on-pages@1.13.16`. The adapter automatically detects the Next.js project in the current working directory.

## Known Issue: Monorepo Path Problem

If you encounter the error:
```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/web/web/.next/routes-manifest.json'
```

This error occurs when using `npx @cloudflare/next-on-pages@1` directly instead of `pnpm run build:cf`. The adapter's internal `vercel build` step incorrectly constructs paths in monorepo setups, looking for `web/web/.next` instead of `web/.next`.

### Solution

**Use `pnpm run build:cf` as the build command** (already configured correctly). This script:
- Runs `next build` first, creating `.next` in the correct location
- Then runs the adapter with `--skip-build` to process the output without running `vercel build`

### If the Error Persists

1. **Verify Cloudflare Pages Settings**: 
   - Go to Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments
   - Ensure **Build Command** is exactly: `pnpm run build:cf`
   - Ensure **Root Directory** is set to: `web`
   - Ensure **TURBOPACK=0** environment variable is set

2. **Check Build Logs**: 
   - Verify the build command being used is `pnpm run build:cf`
   - Confirm `next build` runs first
   - Confirm the adapter runs with `--skip-build` flag

3. **Future Migration**: Consider migrating to `@opennextjs/cloudflare` which has better monorepo support. See `web/OPENNEXT_MIGRATION.md` for details.

## Required Environment Variables

**Variable**: `TURBOPACK`  
**Value**: `0`  
**Environment**: Production (and Preview)

**Location**: Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

This disables Turbopack (incompatible with the adapter) and forces webpack usage.

## Build Output

The adapter generates output in `.vercel/output/static`, which is configured in `web/wrangler.toml`:

```toml
pages_build_output_dir = ".vercel/output/static"
```

## Local Testing

To test the build locally:

```bash
# From the web directory
cd web
pnpm run build:cf
```

This runs the same script that Cloudflare Pages uses:
1. `TURBOPACK=0 next build` - Creates `.next` directory
2. `TURBOPACK=0 npx @cloudflare/next-on-pages --skip-build` - Processes output without running `vercel build`

## Verification Checklist

After updating Cloudflare Pages dashboard settings:

- [ ] **Build Command** is set to: `pnpm run build:cf`
- [ ] **Root Directory** is set to: `web`
- [ ] **TURBOPACK=0** environment variable is set in Production (and Preview)
- [ ] Build logs show `pnpm run build:cf` being executed
- [ ] Build logs show `next build` running first
- [ ] Build logs show adapter running with `--skip-build` flag
- [ ] Build completes without `web/web/.next` path error
- [ ] `.vercel/output/static` directory is generated correctly

