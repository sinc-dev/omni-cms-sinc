# Cloudflare Pages Build Settings - UPDATED

## ✅ Correct Settings for OpenNext

Update your Cloudflare Pages dashboard with these settings:

### Build Settings

**Build command:**
```
pnpm install --no-frozen-lockfile && pnpm run build:cf
```
⚠️ **UPDATE REQUIRED**: Add `--no-frozen-lockfile` flag to allow pnpm to update the lockfile during CI builds.

**Why**: The `pnpm-lock.yaml` is out of sync (still has old `@cloudflare/next-on-pages`). This flag allows pnpm to update it during the build.

**Note**: After updating the lockfile locally and committing it, you can revert to `pnpm install && pnpm run build:cf`.

**Build output directory:**
```
.open-next
```
❌ **CHANGE REQUIRED**: Currently set to `/.vercel/output/static` - this is for the old deprecated adapter.

**Root directory:**
```
apps/web
```
✅ **This is correct!** No changes needed.

**Build system version:**
```
3 (latest)
```
✅ **This is correct!** No changes needed.

## What Changed

| Setting | Old (Deprecated) | New (OpenNext) |
|---------|------------------|----------------|
| Output Directory | `/.vercel/output/static` | `.open-next` |
| Adapter | `@cloudflare/next-on-pages` | `@opennextjs/cloudflare` |
| Build Command | Same | Same ✅ |

## How to Update

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click **Settings** tab
3. Scroll to **Builds & deployments**
4. Find **Build output directory**
5. Change from: `/.vercel/output/static`
6. Change to: `.open-next`
7. Click **Save**

## Why This Change?

- **Old adapter** (`@cloudflare/next-on-pages`): Outputs to `.vercel/output/static`
- **New adapter** (`@opennextjs/cloudflare`): Outputs to `.open-next`

The old adapter was deprecated in September 2025. OpenNext is the official Cloudflare recommendation.

## Verification

After updating, your next deployment should:
1. ✅ Build successfully (no segfault errors)
2. ✅ Create `.open-next` directory
3. ✅ Deploy correctly to Cloudflare Pages

## Complete Settings Summary

```
Build command:        pnpm install --no-frozen-lockfile && pnpm run build:cf
Build output dir:     .open-next
Root directory:       apps/web
Build system:         3 (latest)
Node version:         22 (or latest)
```

## Important: Lockfile Update

The `--no-frozen-lockfile` flag is needed because `pnpm-lock.yaml` is out of sync with `package.json` after the OpenNext migration.

**To fix permanently:**
1. Run locally: `cd apps/web && pnpm install`
2. Commit the updated `pnpm-lock.yaml`
3. Push to repository
4. Then you can use: `pnpm install && pnpm run build:cf` (without the flag)

## Environment Variables

**Build Environment Variables:**
- `NODE_OPTIONS` = `--max-old-space-size=3584` (or `4096`)

**Runtime Environment Variables:**
- `R2_BUCKET_NAME` = `omni-cms-media`
- `CF_ACCESS_TEAM_DOMAIN`
- `CF_ACCESS_AUD`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_APP_URL`

## Bindings (Unchanged)

- **D1 Database**: `DB` → `omni-cms`
- **R2 Bucket**: `R2_BUCKET` → `omni-cms-media`
