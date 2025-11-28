# OpenNext Migration Complete ✅

## What Changed

We've migrated from the **deprecated** `@cloudflare/next-on-pages` to the **official Cloudflare-recommended** `@opennextjs/cloudflare` adapter.

### Key Changes

1. **Package Updated**: Replaced `@cloudflare/next-on-pages@1.12.0` with `@opennextjs/cloudflare@^1.0.0-beta`
2. **Configuration**: Created `opennext.config.ts` with Cloudflare-specific settings
3. **Build Scripts**: Updated to use OpenNext commands
4. **Wrangler Config**: Updated `pages_build_output_dir` from `.vercel/output/static` to `.open-next`
5. **Compatibility Date**: Updated to `2025-03-25` (required for OpenNext)

## Why This Is Better

✅ **Officially Recommended**: Cloudflare's official adapter (as of 2025)  
✅ **Next.js 16 Support**: Fully compatible with Next.js 16.0.3  
✅ **No Vercel CLI**: Eliminates segfault issues from Vercel CLI 48.x  
✅ **Better Node.js Support**: Improved Node.js API compatibility  
✅ **Actively Maintained**: Not deprecated like `@cloudflare/next-on-pages`  
✅ **Modern Architecture**: Uses Cloudflare Workers Node.js runtime  

## New Build Commands

```bash
# Build for Cloudflare Pages
pnpm run build:cf

# Preview locally (with Cloudflare Workers simulation)
pnpm run preview:cf

# Deploy directly (alternative to Pages dashboard)
pnpm run deploy:cf

# Generate TypeScript types for Cloudflare bindings
pnpm run cf-typegen
```

## Cloudflare Pages Dashboard Updates

### Build Settings

**Build Command:**
```bash
pnpm install && pnpm run build:cf
```

**Build Output Directory:**
```
.open-next
```

**Root Directory:**
```
apps/web
```

### Environment Variables

**Build Environment Variables** (still recommended):
- `NODE_OPTIONS` = `--max-old-space-size=3584` (or `4096`)

**Runtime Environment Variables** (unchanged):
- `R2_BUCKET_NAME` = `omni-cms-media`
- `CF_ACCESS_TEAM_DOMAIN`
- `CF_ACCESS_AUD`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_APP_URL`

### Bindings (unchanged)

- **D1 Database**: `DB` → `omni-cms`
- **R2 Bucket**: `R2_BUCKET` → `omni-cms-media`

## What's Different from next-on-pages

| Feature | @cloudflare/next-on-pages | @opennextjs/cloudflare |
|---------|---------------------------|------------------------|
| Status | ❌ Deprecated (Sept 2025) | ✅ Official & Active |
| Next.js 16 | ⚠️ Not officially supported | ✅ Supported |
| Vercel CLI | ❌ Required (buggy) | ✅ Not needed |
| Output Dir | `.vercel/output/static` | `.open-next` |
| Node.js APIs | Limited | Better support |
| Build Time | Slower (Vercel CLI) | Faster |

## Testing

1. **Local Build Test:**
   ```bash
   cd apps/web
   pnpm run build:cf
   ```

2. **Verify Output:**
   ```bash
   ls -la .open-next
   ```

3. **Preview Locally:**
   ```bash
   pnpm run preview:cf
   ```

## Troubleshooting

### Build Fails

- Ensure `NODE_OPTIONS` is set in Cloudflare Pages dashboard (Build environment variables)
- Check that `compatibility_date` in `wrangler.toml` is `2025-03-25` or later
- Verify `nodejs_compat` flag is enabled in `wrangler.toml`

### Missing Bindings

- Ensure D1 and R2 bindings are configured in Cloudflare Pages dashboard
- Check `wrangler.toml` has correct database and bucket names

### Type Errors

Run type generation:
```bash
pnpm run cf-typegen
```

## Resources

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Next.js Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [OpenNext GitHub](https://github.com/opennextjs/cloudflare)

## Migration Date

Migrated: November 2025  
Reason: `@cloudflare/next-on-pages` deprecated September 29, 2025
