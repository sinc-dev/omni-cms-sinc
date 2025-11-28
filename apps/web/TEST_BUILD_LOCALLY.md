# Testing OpenNext Build Locally

## Quick Test Steps

### 1. Install Dependencies

```bash
cd apps/web
pnpm install
```

This will install `@opennextjs/cloudflare@^1.0.0-beta` if it's not already installed.

### 2. Run the Build

```bash
pnpm run build:cf
```

This will:
1. Build Next.js app (creates `.next` directory)
2. Run OpenNext adapter (creates `.open-next` directory)

### 3. Verify Output

After the build completes, check for:

```bash
# Check if .next exists (Next.js build)
ls .next

# Check if .open-next exists (OpenNext output)
ls .open-next
```

Expected output structure:
```
.open-next/
├── assets/          # Static assets
├── worker.js        # Cloudflare Worker entry point
└── ...              # Other OpenNext files
```

## What to Look For

### ✅ Success Indicators

- Build completes without errors
- `.next` directory is created
- `.open-next` directory is created
- No segfault errors (unlike old @cloudflare/next-on-pages)
- Build finishes in reasonable time

### ❌ Common Issues

1. **Package not installed**
   ```
   Error: Cannot find module '@opennextjs/cloudflare'
   ```
   **Fix**: Run `pnpm install`

2. **Next.js build fails**
   ```
   Error: .next directory not found
   ```
   **Fix**: Check Next.js build errors first

3. **OpenNext command not found**
   ```
   Error: npx: command not found: opennextjs-cloudflare
   ```
   **Fix**: Ensure package is in devDependencies and run `pnpm install`

## Testing Individual Steps

### Step 1: Next.js Build Only

```bash
pnpm run build
```

This should create `.next` directory.

### Step 2: OpenNext Build Only

After Next.js build succeeds:

```bash
npx opennextjs-cloudflare build
```

This should create `.open-next` directory.

## Preview Locally

To preview the build locally with Cloudflare Workers simulation:

```bash
pnpm run preview:cf
```

This runs `wrangler dev` with the OpenNext output.

## Expected Build Time

- Next.js build: ~30-60 seconds (depending on your machine)
- OpenNext build: ~10-30 seconds
- Total: ~1-2 minutes

## Comparison with Old Adapter

| Aspect | Old (@cloudflare/next-on-pages) | New (@opennextjs/cloudflare) |
|--------|----------------------------------|------------------------------|
| Build Time | Slower (uses Vercel CLI) | Faster (direct transformation) |
| Errors | Segfaults possible | No segfaults |
| Output | `.vercel/output/static` | `.open-next` |
| Dependencies | Vercel CLI (buggy) | No external CLI needed |

## Troubleshooting

### Build Hangs

If the build seems to hang:
1. Check memory usage (OpenNext uses less memory than old adapter)
2. Check if Node.js process is actually running (not frozen)
3. Try with `NODE_OPTIONS=--max-old-space-size=4096`

### Missing Files

If `.open-next` is created but empty:
1. Check Next.js build completed successfully
2. Verify `opennext.config.ts` exists and is valid
3. Check `wrangler.toml` has correct settings

### Type Errors

If you see TypeScript errors:
```bash
pnpm run cf-typegen
```

This generates Cloudflare environment types.

## Next Steps After Successful Build

1. ✅ Verify `.open-next` directory exists
2. ✅ Check Cloudflare Pages dashboard settings:
   - Build output directory: `.open-next`
   - Build command: `pnpm install && pnpm run build:cf`
3. ✅ Test deployment to Cloudflare Pages

## Need Help?

- Check `OPENNEXT_MIGRATION_COMPLETE.md` for full migration details
- See [OpenNext Documentation](https://opennext.js.org/cloudflare)
- Check [Cloudflare Next.js Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
