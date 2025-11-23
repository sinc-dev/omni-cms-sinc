# Cloudflare Pages Build Configuration

## Root Cause Fix

The `web/web/.next` path error was caused by Vercel configuration files (`.vercel` folder or `vercel.json`) in the repository that specified `rootDirectory: "web"`. When `@cloudflare/next-on-pages` runs `vercel build` internally, it sees this config and appends `web/` to the already-set working directory (`/opt/buildhome/repo/web`), resulting in `/opt/buildhome/repo/web/web/.next`.

**Solution**: Remove all Vercel configuration files from the repository. With no local Vercel config, `vercel build` treats the current directory (`/opt/buildhome/repo/web`) as the project root, creating `.next` at the correct location.

## Cloudflare Pages Dashboard Settings

### Required Configuration

**Root Directory**: `web`

**Build Command**: 
```bash
pnpm run build
```

**Build Output Directory**: 
```txt
.vercel/output/static
```

**Why this works**:
- With root directory = `web`, Cloudflare runs commands from `/opt/buildhome/repo/web`
- Without Vercel config files, `vercel build` treats the current directory as project root
- `.next` is created at `/opt/buildhome/repo/web/.next` ✅
- No double `web/web/.next` path issue ✅

### Build Script

The `build` script in `web/package.json`:

```json
"build": "TURBOPACK=0 npx @cloudflare/next-on-pages@1"
```

**How it works**:
1. `@cloudflare/next-on-pages` runs `vercel build` internally
2. `vercel build` runs `next build`, creating `.next` at `/opt/buildhome/repo/web/.next` ✅
3. The adapter processes the output and generates `.vercel/output/static`

**Note**: There's also a `build:local` script for local development that just runs `next build` without the adapter.

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

**Note**: 
- `pages_build_output_dir = ".vercel/output/static"` does NOT mean you're deploying to Vercel
- It tells Cloudflare Pages where to find the built assets that follow Vercel's Build Output spec
- `wrangler.toml` is kept because it contains D1 database and R2 bucket bindings needed for runtime

## Troubleshooting

### Error: `web/web/.next` path not found

If you still see this error:

1. **Verify Vercel config files are removed from the repo**:
   ```bash
   git ls-files | grep -E '(\.vercel|vercel\.json)'
   ```
   Should return nothing. If it shows files, remove them:
   ```bash
   git rm -r .vercel web/vercel.json 2>/dev/null || true
   git commit -m "chore: remove local Vercel config for Cloudflare Pages"
   git push
   ```

2. **Verify `.vercel` is in `.gitignore`**:
   ```gitignore
   .vercel
   .vercel/output
   ```

3. **Check Cloudflare Pages Settings**:
   - Root Directory: `web`
   - Build Command: `pnpm run build`
   - Build Output Directory: `.vercel/output/static`

4. **Verify TURBOPACK=0** is set in environment variables

5. **Check build logs** - You should see:
   ```
   Executing user command: pnpm run build
   > TURBOPACK=0 npx @cloudflare/next-on-pages@1
   ...
   ```
   And you should **NOT** see any path like `/web/web/.next/...`

## Local Testing

To test the build locally:

```bash
# From the web directory
cd web
pnpm run build
```

This runs the same script that Cloudflare Pages uses:
- `TURBOPACK=0 npx @cloudflare/next-on-pages@1` - Runs the adapter which handles the build

For local development without the adapter:

```bash
cd web
pnpm run build:local
```

## Verification Checklist

After configuring Cloudflare Pages:

- [ ] **Root Directory** is set to: `web`
- [ ] **Build Command** is set to: `pnpm run build`
- [ ] **Build Output Directory** is set to: `.vercel/output/static`
- [ ] **TURBOPACK=0** environment variable is set in Production (and Preview)
- [ ] No `.vercel` folder or `vercel.json` file in the repository
- [ ] `.vercel` is in `.gitignore`
- [ ] Build logs show `pnpm run build` being executed
- [ ] Build logs show paths like `/opt/buildhome/repo/web/.next` (NOT `/web/web/.next`)
- [ ] Build completes without `web/web/.next` path error
- [ ] `.vercel/output/static` directory is generated correctly
