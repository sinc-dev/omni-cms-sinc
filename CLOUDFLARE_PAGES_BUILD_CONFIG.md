# Cloudflare Pages Build Configuration

## Current Setup

The project uses `@cloudflare/next-on-pages` adapter to deploy Next.js to Cloudflare Pages.

## Cloudflare Pages Dashboard Settings

### Option 1: Root Directory = `/` (Repo Root) - Recommended

**Root Directory**: `/` (leave blank or set to `/`)

**Build Command**: 
```bash
pnpm run build:cf
```

This uses the root `build:cf` script which changes to the `web` directory before running the adapter.

### Option 2: Root Directory = `web` (Current - Has Known Issue)

**Root Directory**: `web`

**Build Command**: 
```bash
pnpm run build:cf
```

**Note**: This uses `--skip-build` to work around the `web/web/.next` path issue. The build script runs `next build` first, then the adapter processes the output without running `vercel build` internally.

**Known Limitation**: The `@cloudflare/next-on-pages@1.13.16` adapter has a bug where `vercel build` (used internally) incorrectly constructs paths in monorepo setups, looking for `web/web/.next` instead of `web/.next`. Using `--skip-build` avoids this by not running `vercel build`.

**Build Output Directory**: Leave empty (auto-detected from `wrangler.toml`)

**Why**: 
- When root directory is `web`, Cloudflare Pages runs commands from `/opt/buildhome/repo/web`
- The adapter automatically detects `package.json`, `next.config.ts`, and `wrangler.toml` in the current directory
- No flags needed - the adapter works from the current working directory
- `wrangler.toml` is found because it's in the same directory where the adapter runs

**Note**: The `--project-dir` flag is **not supported** by `@cloudflare/next-on-pages@1.13.16`. The adapter automatically detects the Next.js project in the current working directory.

## Known Issue: Monorepo Path Problem

If you encounter the error:
```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/web/web/.next/routes-manifest.json'
```

This is a known issue with `@cloudflare/next-on-pages@1.13.16` in monorepo setups. The adapter incorrectly appends the package name "web" to the path, resulting in `web/web/.next` instead of `web/.next`.

### Potential Solutions

1. **Migrate to OpenNext** (Recommended): The `@cloudflare/next-on-pages` adapter is deprecated. Consider migrating to `@opennextjs/cloudflare` which has better monorepo support. See `web/OPENNEXT_MIGRATION.md` for details.

2. **Workaround**: If you must use the current adapter, you may need to:
   - Ensure the root directory in Cloudflare Pages is set to `/` (repo root) instead of `web`
   - Use a custom build script that changes directory before running the adapter
   - Or temporarily rename the package in `package.json` during build (not recommended)

3. **Check Cloudflare Pages Settings**: Verify that the root directory is correctly set to `web` in the Cloudflare Pages dashboard. Sometimes the setting doesn't take effect immediately.

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
# From repo root
pnpm run build:cf
```

This runs the adapter with the correct project directory configuration.

