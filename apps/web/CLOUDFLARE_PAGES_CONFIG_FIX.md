# Cloudflare Pages Configuration Fix

## Critical Issue: Path Duplication Error

The build is failing with:
```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/apps/web/apps/web/.next/routes-manifest.json'
```

This is caused by incorrect Root Directory configuration in Cloudflare Pages.

## Root Cause

When Root Directory is set to `/apps/web`, `vercel build` (called by `@cloudflare/next-on-pages`) resolves paths incorrectly, creating duplication:
- Expected: `/opt/buildhome/repo/apps/web/.next/routes-manifest.json`
- Actual: `/opt/buildhome/repo/apps/web/apps/web/.next/routes-manifest.json`

## Solution: Update Cloudflare Pages Settings

### In Cloudflare Pages Dashboard:

1. Go to **Settings** → **Builds & deployments**

2. Update these settings:

   **Root directory:**
   - Change from: `/apps/web` 
   - Change to: `/` (repo root) or leave blank
   
   **Build command:**
   - Change from: `pnpm install && pnpm run build:cf`
   - Change to: `pnpm install && pnpm --filter web run build:cf`
   
   **Build output directory:**
   - Keep as: `apps/web/.vercel/output/static`
   - OR change to: `.vercel/output/static` if using root directory `/`

### Why This Works

When Root Directory is `/`:
- Cloudflare Pages runs commands from `/opt/buildhome/repo`
- `pnpm --filter web` automatically changes to `apps/web/` directory
- Build runs from the correct location without path duplication
- `vercel build` resolves paths correctly

When Root Directory is `/apps/web`:
- Cloudflare Pages runs commands from `/opt/buildhome/repo/apps/web`
- But `vercel build` still tries to resolve paths relative to `/apps/web`
- This causes the duplication: `/opt/buildhome/repo/apps/web` + `/apps/web` = duplication

## Alternative: If You Must Keep Root Directory as `/apps/web`

If you need to keep Root Directory as `/apps/web` for some reason, update the Build Command to:

```
pnpm install && cd apps/web && pnpm run build:cf
```

However, this is not recommended as it can still cause path resolution issues.

## Recommended Configuration

```
Root directory: / (or blank)
Build command: pnpm install && pnpm --filter web run build:cf
Build output directory: apps/web/.vercel/output/static
```

## After Updating

1. Save the settings in Cloudflare Pages dashboard
2. Trigger a new deployment (or push a commit)
3. The build should complete successfully without path duplication errors

