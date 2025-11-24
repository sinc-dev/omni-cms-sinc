# Cloudflare Deployment Configuration Fix

## Issues Found

1. **API Worker**: Using old wrangler version (3.114.15) - needs update
2. **Pages App**: Wrong root directory (`/app/Webpack`) and wrong build output path
3. **Root wrangler.toml**: Conflicting configuration file

## Fixed Issues

### ✅ API Worker Configuration

**Root directory:** `apps/api`

**Build command:**
```bash
pnpm install
```

**Deploy command:**
```bash
pnpm run deploy
```

**Note:** The deploy script already includes `--yes` flag for non-interactive deployment.

**`wrangler.toml` already has:**
```toml
main = "src/index.ts"  # ✅ Fixed
```

### ✅ Pages App Configuration

**Root directory:** `apps/web` (NOT `/app/Webpack`)

**Build command:**
```bash
pnpm install && pnpm run build:cf
```

**Build output directory:** `.vercel/output/static` (relative path, NOT absolute `/.vercel/output/static`)

**Note:** Removed root `wrangler.toml` file that was causing conflicts.

## Correct Cloudflare Pages Settings

### Build Configuration

| Setting | Correct Value |
|---------|---------------|
| **Root directory** | `apps/web` |
| **Build command** | `pnpm install && pnpm run build:cf` |
| **Build output directory** | `.vercel/output/static` |
| **Node version** | `20` or `22` |

### Important Notes

1. **Root directory** must be `apps/web` (lowercase, relative path)
2. **Build output directory** must be `.vercel/output/static` (relative, starts with `.`)
3. **Do NOT** use absolute paths like `/app/Webpack` or `/.vercel/output/static`
4. The `wrangler.toml` in `apps/web` will be automatically detected

## Verification

After updating settings, the build should:
1. ✅ Install dependencies correctly
2. ✅ Build Next.js app with Webpack
3. ✅ Run Cloudflare Pages adapter
4. ✅ Output to `.vercel/output/static`
5. ✅ Deploy successfully

