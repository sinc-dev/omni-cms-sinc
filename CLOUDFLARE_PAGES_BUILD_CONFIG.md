# Cloudflare Pages Build Configuration

## Current Setup

The project uses `@cloudflare/next-on-pages` adapter to deploy Next.js to Cloudflare Pages.

## Cloudflare Pages Dashboard Settings

### Option 1: Using `--project-dir` flag (Recommended for monorepo)

**Root Directory**: `/` (repo root - leave blank or set to `/`)

**Build Command**: 
```bash
npx @cloudflare/next-on-pages@1 --project-dir=web
```

**OR use the root script**:
```bash
pnpm run build:cf
```

**Build Output Directory**: Leave empty (auto-detected from `wrangler.toml`)

**Why**: When root directory is `/`, the adapter runs from repo root and `--project-dir=web` correctly points to the `web` workspace.

---

### Option 2: Without `--project-dir` flag

**Root Directory**: `web`

**Build Command**: 
```bash
npx @cloudflare/next-on-pages@1
```

**Build Output Directory**: Leave empty (auto-detected from `wrangler.toml`)

**Why**: When root directory is `web`, the adapter runs from `/opt/buildhome/repo/web` and automatically detects the Next.js project in the current directory.

---

## ⚠️ Important: Avoid Double Path Issue

**DO NOT** combine:
- Root directory: `web`
- Build command: `npx @cloudflare/next-on-pages@1 --project-dir=web`

This causes the adapter to look in `/opt/buildhome/repo/web/web/.next` instead of `/opt/buildhome/repo/web/.next`, resulting in:
```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/web/web/.next/routes-manifest.json'
```

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

