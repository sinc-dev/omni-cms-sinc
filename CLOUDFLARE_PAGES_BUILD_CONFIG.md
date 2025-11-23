# Cloudflare Pages Build Configuration

## Root Cause Fix

The `web/web/.next` path error was caused by a `.vercel` folder in the repo containing `rootDirectory: "web"`. When `vercel build` (run by `@cloudflare/next-on-pages`) sees this config, it appends `web/` to the already-set working directory (`/opt/buildhome/repo/web`), resulting in `/opt/buildhome/repo/web/web/.next`.

**Solution**: Ensure `.vercel` folder is **not in the repository**. It's already in `.gitignore`, so it won't be committed.

## Cloudflare Pages Dashboard Settings

### Required Configuration

**Root Directory**: `web`

**Build Command**: 
```bash
npx @cloudflare/next-on-pages@1
```

**Build Output Directory**: 
```txt
.vercel/output/static
```

**Why this works**:
- With root directory = `web`, Cloudflare runs commands from `/opt/buildhome/repo/web`
- Without `.vercel` folder, `vercel build` treats the current directory as project root
- `next build` creates `.next` at `/opt/buildhome/repo/web/.next` ✅
- No double `web/web/.next` path issue ✅

### Alternative: Using build:cf Script

If you prefer to use a script, you can use:

**Build Command**: 
```bash
pnpm run build:cf
```

This runs:
1. `TURBOPACK=0 next build` - Creates `.next` directory
2. `TURBOPACK=0 npx @cloudflare/next-on-pages@1` - Processes the output

**Note**: The `build:cf` script is optional. You can use `npx @cloudflare/next-on-pages@1` directly since it will run `next build` internally.

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

1. **Verify `.vercel` is not in the repo**:
   ```bash
   git ls-files | grep .vercel
   ```
   Should return nothing. If it shows files, remove them:
   ```bash
   git rm -r .vercel
   git commit -m "Remove .vercel config for Cloudflare build"
   git push
   ```

2. **Verify `.vercel` is in `.gitignore`**:
   ```gitignore
   .vercel
   .vercel/output
   ```

3. **Check Cloudflare Pages Settings**:
   - Root Directory: `web`
   - Build Command: `npx @cloudflare/next-on-pages@1` (or `pnpm run build:cf`)
   - Build Output Directory: `.vercel/output/static`

4. **Verify TURBOPACK=0** is set in environment variables

## Local Testing

To test the build locally:

```bash
# From the web directory
cd web
pnpm run build:cf
```

Or use the adapter directly:

```bash
cd web
TURBOPACK=0 npx @cloudflare/next-on-pages@1
```

## Verification Checklist

After configuring Cloudflare Pages:

- [ ] **Root Directory** is set to: `web`
- [ ] **Build Command** is set to: `npx @cloudflare/next-on-pages@1` (or `pnpm run build:cf`)
- [ ] **Build Output Directory** is set to: `.vercel/output/static`
- [ ] **TURBOPACK=0** environment variable is set in Production (and Preview)
- [ ] `.vercel` folder is NOT in the repository (check with `git ls-files | grep .vercel`)
- [ ] `.vercel` is in `.gitignore`
- [ ] Build completes without `web/web/.next` path error
- [ ] `.vercel/output/static` directory is generated correctly
