# Cloudflare Pages Build Configuration

## Current Setup

The project uses `@cloudflare/next-on-pages` adapter to deploy Next.js to Cloudflare Pages.

## Cloudflare Pages Dashboard Settings

**Root Directory**: `web`

**Build Command**: 
```bash
npx @cloudflare/next-on-pages@1
```

**OR use the root script**:
```bash
pnpm run build:cf
```

**Build Output Directory**: Leave empty (auto-detected from `wrangler.toml`)

**Why**: 
- When root directory is `web`, Cloudflare Pages runs commands from `/opt/buildhome/repo/web`
- The adapter automatically detects `package.json`, `next.config.ts`, and `wrangler.toml` in the current directory
- No flags needed - the adapter works from the current working directory
- `wrangler.toml` is found because it's in the same directory where the adapter runs

**Note**: The `--project-dir` flag is **not supported** by `@cloudflare/next-on-pages@1.13.16`. The adapter automatically detects the Next.js project in the current working directory.

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

