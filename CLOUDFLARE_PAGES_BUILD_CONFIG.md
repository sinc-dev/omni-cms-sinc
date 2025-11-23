# Cloudflare Pages Build Configuration

## Root Cause

The `web/web/.next` path error occurs because `@cloudflare/next-on-pages` internally runs `npx vercel build`, which has its own understanding of the project's `rootDirectory`. Even without a `.vercel` folder in the repo, `vercel build` still thinks the root directory is `web`, and when Cloudflare Pages already sets the working directory to `/opt/buildhome/repo/web`, it results in `/opt/buildhome/repo/web/web/.next`.

**Solution**: **Stop using `vercel build` entirely**. Run `next build` manually, then use the adapter with `--skip-build` to process the output without running `vercel build`.

## Cloudflare Pages Dashboard Settings

### ⚠️ CRITICAL: Must Use `pnpm run build:cf`

**Root Directory**: `web`

**Build Command**: 
```bash
pnpm run build:cf
```

**Build Output Directory**: 
```txt
.vercel/output/static
```

**DO NOT use**: `npx @cloudflare/next-on-pages@1` directly (it will run `vercel build` internally and cause the `web/web/.next` error)

### How `build:cf` Works

The `build:cf` script in `web/package.json`:

```json
"build:cf": "TURBOPACK=0 next build && npx @cloudflare/next-on-pages@1 --skip-build"
```

**Step-by-step**:
1. `TURBOPACK=0 next build` - Runs Next.js build in the current directory (`/opt/buildhome/repo/web`), creating `.next` at `/opt/buildhome/repo/web/.next` ✅
2. `npx @cloudflare/next-on-pages@1 --skip-build` - Processes the existing `.next` output without running `vercel build`
3. The `--skip-build` flag prevents the adapter from running `vercel build`, which would incorrectly look for `web/web/.next`

**Why this works**:
- We run `next build` ourselves in the correct location
- The adapter skips its internal `vercel build` step
- No double `web/web/.next` path issue ✅

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

**Note**: `wrangler.toml` is kept because it contains D1 database and R2 bucket bindings needed for runtime.

## Troubleshooting

### Error: `web/web/.next` path not found

If you still see this error:

1. **Verify you're using `pnpm run build:cf`** (not `npx @cloudflare/next-on-pages@1` directly)
   - Go to Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments
   - Ensure **Build Command** is exactly: `pnpm run build:cf`

2. **Verify the `build:cf` script has `--skip-build`**:
   ```json
   "build:cf": "TURBOPACK=0 next build && npx @cloudflare/next-on-pages@1 --skip-build"
   ```

3. **Check Cloudflare Pages Settings**:
   - Root Directory: `web`
   - Build Command: `pnpm run build:cf` ⚠️ **MUST use this**
   - Build Output Directory: `.vercel/output/static`

4. **Verify TURBOPACK=0** is set in environment variables

5. **Check build logs** - You should see:
   ```
   Executing user command: pnpm run build:cf
   > TURBOPACK=0 next build && npx @cloudflare/next-on-pages@1 --skip-build
   ...
   Skipping Next.js build as requested with --skip-build
   ```

## Local Testing

To test the build locally:

```bash
# From the web directory
cd web
pnpm run build:cf
```

This runs the same script that Cloudflare Pages uses:
1. `TURBOPACK=0 next build` - Creates `.next` directory
2. `npx @cloudflare/next-on-pages@1 --skip-build` - Processes output without running `vercel build`

## Verification Checklist

After configuring Cloudflare Pages:

- [ ] **Root Directory** is set to: `web`
- [ ] **Build Command** is set to: `pnpm run build:cf` ⚠️ **MUST use this exact command**
- [ ] **Build Output Directory** is set to: `.vercel/output/static`
- [ ] **TURBOPACK=0** environment variable is set in Production (and Preview)
- [ ] `build:cf` script in `web/package.json` includes `--skip-build` flag
- [ ] Build logs show `pnpm run build:cf` being executed
- [ ] Build logs show "Skipping Next.js build as requested with --skip-build"
- [ ] Build completes without `web/web/.next` path error
- [ ] `.vercel/output/static` directory is generated correctly
