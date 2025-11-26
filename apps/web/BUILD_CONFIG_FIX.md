# Cloudflare Pages Build Configuration Fix (For Root Directory /apps/web)

## Working Configuration

This configuration works with Root Directory `/apps/web` (as used in successful builds):

### Cloudflare Pages Dashboard Settings

**Keep these settings (as they were working before):**

| Setting | Value |
|---------|-------|
| **Root directory** | `/apps/web` ✅ **KEEP THIS** |
| **Build command** | `pnpm install && pnpm run build:cf` ✅ **KEEP THIS** |
| **Build output directory** | `/.vercel/output/static` or `.vercel/output/static` |

### Environment Variables

**IMPORTANT**: Add this environment variable in Cloudflare Pages settings to prevent out-of-memory errors:

| Variable | Value |
|----------|-------|
| **NODE_OPTIONS** | `--max-old-space-size=4096` |

Go to **Cloudflare Dashboard → Pages → Your Project → Settings → Environment variables** and add `NODE_OPTIONS` with value `--max-old-space-size=4096`.

## How It Works

The build script (`build-cf.js`) creates symlinks to prevent path duplication:

1. **`web` symlink**: Points to `.` (current directory) - creates `apps/web/web` → `apps/web`
2. **`apps` symlink**: Points to `..` (parent directory) - creates `apps/web/apps` → `apps/`
   - This allows `apps/web/apps/web` to resolve to `apps/web` ✅

When `vercel build` (called by `@cloudflare/next-on-pages`) looks for `apps/web/apps/web/.next/`, the symlinks redirect it to the correct location `apps/web/.next/`.

## Build Flow

1. Cloudflare Pages sets Root Directory to `/apps/web`
2. Cloudflare runs `pnpm install && pnpm run build:cf` from `/opt/buildhome/repo/apps/web`
3. `build:cf` runs `next build --webpack && node scripts/build-cf.js`
4. `build-cf.js` creates symlinks (`web` and `apps`), deletes source maps, then runs `@cloudflare/next-on-pages`
5. `@cloudflare/next-on-pages` internally runs `vercel build`
6. `vercel build` looks for `apps/web/apps/web/.next/` but symlinks redirect to `apps/web/.next/` ✅
7. Next.js creates `.next` at `/opt/buildhome/repo/apps/web/.next` ✅
8. Adapter processes output and generates `.vercel/output/static` in `apps/web/` directory ✅
9. Cloudflare Pages finds output at `.vercel/output/static` relative to Root Directory ✅

## Why This Works

1. **Symlink `web`**: When `vercel build` looks for `apps/web/web/`, the symlink redirects to `apps/web/`
2. **Symlink `apps`**: When `vercel build` looks for `apps/web/apps/web/`, the symlink chain redirects:
   - `apps/web/apps` → `apps/` (via symlink)
   - `apps/web/apps/web` → `apps/web` ✅
3. This prevents path duplication while keeping your working Cloudflare Pages configuration

## What Changed in build-cf.js

The build script now creates **two symlinks** instead of one:

- `web` → `.` (current directory) - for backward compatibility
- `apps` → `..` (parent directory) - to handle `apps/web/apps/web` path duplication

Both symlinks are created before running `@cloudflare/next-on-pages` and cleaned up after.

## Alternative Configuration (If Symlinks Don't Work)

If the symlink approach still fails, you can use this alternative:

| Setting | Value |
|---------|-------|
| **Root directory** | `/` (repo root) |
| **Build command** | `pnpm install && pnpm --filter web run build:cf` |
| **Build output directory** | `apps/web/.vercel/output/static` |

This is the configuration recommended in `CLOUDFLARE_PAGES_BUILD_CONFIG.md`, but the symlink approach should work with your current settings.

## References

- Original fix: `CLOUDFLARE_PAGES_BUILD_CONFIG.md` (repo root) - Alternative configuration
- Build script: `apps/web/scripts/build-cf.js` - Contains symlink creation logic
- Deployment guide: `apps/web/DEPLOYMENT.md`
