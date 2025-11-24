# Cloudflare Pages Build Fix

## Issue
The build was failing because:
1. Turbopack was being used by default in Next.js 16
2. Turbopack couldn't find the Next.js package in monorepo setup
3. The build command needed to explicitly use Webpack

## Solution

### Updated Build Command for Cloudflare Pages

**In Cloudflare Dashboard → Pages → Settings → Builds & deployments:**

**Build command:**
```bash
cd apps/web && pnpm install && pnpm run build:cf
```

**OR if using root directory `apps/web`:**

**Build command:**
```bash
pnpm install && pnpm run build:cf
```

### What Changed

1. **`next.config.ts`**: 
   - Added `turbopack: { root }` configuration for monorepo support
   - Kept Webpack config for compatibility

2. **`package.json`**:
   - Changed `build:cf` to use `--webpack` flag explicitly
   - Created cross-platform build script (`scripts/build-cf.js`)

3. **Build Script**:
   - Handles symlink creation/deletion (for path resolution)
   - Deletes source maps (to reduce bundle size)
   - Runs `@cloudflare/next-on-pages` adapter

### Build Output Directory

**Already configured in `wrangler.toml`:**
```toml
pages_build_output_dir = ".vercel/output/static"
```

Cloudflare Pages will automatically detect this from `wrangler.toml`.

### Environment Variables Needed

Set these in Cloudflare Pages → Settings → Environment Variables:

- `NEXT_PUBLIC_API_URL` - Your API Worker URL
- `NEXT_PUBLIC_APP_URL` - Your Pages URL
- `CF_ACCESS_TEAM_DOMAIN` - Cloudflare Access team domain
- `CF_ACCESS_AUD` - Cloudflare Access AUD tag
- `R2_ACCOUNT_ID` - R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `R2_PUBLIC_URL` - Optional: Custom domain for media

### Bindings

Configure in Cloudflare Pages → Settings → Functions:

- **D1 Database**: `DB` → `omni-cms` (ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`)
- **R2 Bucket**: `R2_BUCKET` → `omni-cms-media`

### Testing Locally

The build now works locally:
```bash
cd apps/web
pnpm run build:cf
```

This should complete successfully and create `.vercel/output/static` directory.

