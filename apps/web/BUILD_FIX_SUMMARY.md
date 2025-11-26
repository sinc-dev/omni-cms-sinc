# Build Fix Summary - Path Duplication Error

## The Error

```
Error: ENOENT: no such file or directory, lstat '/opt/buildhome/repo/apps/web/apps/web/.next/routes-manifest.json'
```

The path is duplicated: `apps/web/apps/web/` instead of just `apps/web/`.

## Two Possible Solutions

### Solution A: Keep Root Directory as `/apps/web` (Was Working Before)

**Current Configuration:**
- Root Directory: `/apps/web`
- Build Command: `pnpm install && pnpm run build:cf`
- Build Output Directory: `/.vercel/output/static`

**What Should Work:**
The symlink in `build-cf.js` creates `web` pointing to `.` which should help `vercel build` resolve paths correctly.

**If This Still Fails:**
The issue is that `vercel build` (called internally by `@cloudflare/next-on-pages`) is detecting the git repo root and appending `/apps/web` again.

### Solution B: Use Root Directory as `/` (Recommended Per Documentation)

**According to `CLOUDFLARE_PAGES_BUILD_CONFIG.md`, the correct configuration is:**

- **Root Directory**: `/` (repo root) ⚠️ **CHANGE THIS**
- **Build Command**: `pnpm --filter web run build:cf` ⚠️ **CHANGE THIS**
- **Build Output Directory**: `web/.vercel/output/static` ⚠️ **CHANGE THIS**

**Why This Works:**
- Root Directory `/` allows Cloudflare to see the full monorepo structure
- `pnpm --filter web` tells pnpm to run the script in the `web` folder
- Paths remain absolute and correct, preventing duplication

## What Changed

The build script (`build-cf.js`) now:
1. Creates a symlink `web` pointing to `.` (current directory)
2. Deletes source maps
3. Runs `@cloudflare/next-on-pages`
4. Cleans up the symlink

But `vercel build` (called internally) is still resolving paths incorrectly.

## Recommended Action

**Option 1: Try Solution B** (Change Cloudflare Pages settings as documented)
- This is the documented solution that should work reliably

**Option 2: Debug Solution A** (Keep current config)
- The symlink should help, but something else may be needed
- Check if there are any other path resolution issues
- Consider if the environment variables deletion is causing issues

## Next Steps

1. **Try Solution B first** (change Cloudflare Pages config to use root `/`)
2. **If Solution B doesn't work**, we need to investigate why `vercel build` is still duplicating paths even with the symlink
3. **Check git history** to see what the exact working configuration was 2 days ago

