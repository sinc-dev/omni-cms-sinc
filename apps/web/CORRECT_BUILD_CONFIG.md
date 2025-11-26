# Correct Cloudflare Pages Build Configuration

## Current Issue

The build is failing with path duplication:
```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/apps/web/apps/web/.next/routes-manifest.json'
```

## The Fix (From CLOUDFLARE_PAGES_BUILD_CONFIG.md)

**Change your Cloudflare Pages Dashboard settings to:**

| Setting | Correct Value |
|---------|---------------|
| **Root directory** | `/` (repo root, leave blank or set to `/`) ⚠️ **CRITICAL** |
| **Build command** | `pnpm install && pnpm --filter web run build:cf` ⚠️ **MUST use this** |
| **Build output directory** | `apps/web/.vercel/output/static` ⚠️ **MUST include `apps/web/` prefix** |

## Why This Works

- Root Directory `/` allows Cloudflare to see the entire monorepo structure
- `pnpm --filter web` tells pnpm to run the script in the `apps/web` folder
- File paths remain absolute and correct, preventing the "double apps/web" error
- Output directory `apps/web/.vercel/output/static` is relative to repo root

## What Was Working Before

You mentioned it worked 2 days ago with Root Directory `/apps/web`. The symlink in `build-cf.js` was part of that solution, but it's no longer sufficient. The configuration change above is the documented permanent fix.

## After Changing Settings

1. Save the settings in Cloudflare Pages dashboard
2. Trigger a new deployment (or push a commit)
3. The build should complete successfully without path duplication errors

## References

- See `CLOUDFLARE_PAGES_BUILD_CONFIG.md` (in repo root) for full details
- See `apps/web/DEPLOYMENT.md` for complete deployment guide

