# Cloudflare Pages Build Configuration - Final Solution

## Root Cause

The `web/web/.next` path error occurs because:
1. Cloudflare Pages Root Directory is set to `web`
2. But the root `package.json` has `"build:cf": "cd web && pnpm run build:cf"` which causes a double directory change
3. Vercel CLI (called by `@cloudflare/next-on-pages`) auto-detects the monorepo structure and infers `rootDirectory: "web"`
4. This results in looking for `/opt/buildhome/repo/web/web/.next` instead of `/opt/buildhome/repo/web/.next`

## Final Solution

### 1. Root `package.json` Configuration

**Remove** the `build:cf` script from root `package.json`. It should only have:

```json
{
  "name": "omni-cms",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web run build",
    "start": "pnpm --filter web start",
    "lint": "pnpm --filter web lint"
  }
}
```

**DO NOT** include `"build:cf": "cd web && pnpm run build:cf"` in the root package.json.

### 2. `web/package.json` Configuration

Keep these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "TURBOPACK=0 next build",
    "build:cf": "TURBOPACK=0 npx @cloudflare/next-on-pages@1",
    "start": "next start",
    // ... other scripts
  }
}
```

### 3. Cloudflare Pages Dashboard Settings

**CRITICAL**: These settings must be exact:

- **Root Directory**: `web` ⚠️ **MUST be set to `web`**
- **Build Command**: `pnpm run build:cf` ⚠️ **MUST use this exact command**
- **Build Output Directory**: `.vercel/output/static`

**Why this works**:
- With Root Directory = `web`, Cloudflare runs commands from `/opt/buildhome/repo/web`
- Build Command `pnpm run build:cf` runs the script in `web/package.json`
- No `cd web &&` in the root package.json means no double directory change
- Vercel CLI treats `/opt/buildhome/repo/web` as the project root
- `.next` is created at `/opt/buildhome/repo/web/.next` ✅
- No double `web/web/.next` path issue ✅

### 4. Ensure No Vercel Config Files

**Verify these are NOT in the repository**:
- `.vercel` folder (should be in `.gitignore`)
- `vercel.json` file
- `web/.vercel` folder
- `web/vercel.json` file

Check with:
```bash
git ls-files | grep -E '(\.vercel|vercel\.json)'
```

Should return nothing.

### 5. `wrangler.toml` Location

The `wrangler.toml` file should be in the `web/` directory (not repo root):

```
web/wrangler.toml
```

With content:
```toml
name = "omni-cms-sinc"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "omni-cms"
database_id = "12aad490-4c2d-4cdb-b07f-0f536e20e994"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "omni-cms-media"
```

## Required Environment Variables

**Variable**: `TURBOPACK`  
**Value**: `0`  
**Environment**: Production (and Preview)

**Location**: Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

## Build Flow (Correct)

1. Cloudflare Pages sets Root Directory to `web`
2. Cloudflare runs `pnpm run build:cf` from `/opt/buildhome/repo/web`
3. `build:cf` script runs `TURBOPACK=0 npx @cloudflare/next-on-pages@1`
4. `next-on-pages` internally runs `vercel build`
5. `vercel build` calls the `build` script (`TURBOPACK=0 next build`)
6. Next.js creates `.next` at `/opt/buildhome/repo/web/.next` ✅
7. Adapter processes output and generates `.vercel/output/static` ✅
8. Cloudflare Pages finds output at `web/.vercel/output/static` ✅

## Troubleshooting

### Error: `web/web/.next` path not found

**Check**:
1. Root `package.json` does NOT have `"build:cf": "cd web && ..."`
2. Cloudflare Pages Root Directory is set to `web`
3. Cloudflare Pages Build Command is `pnpm run build:cf` (not `pnpm run build` or anything with `cd web`)
4. No `.vercel` folder or `vercel.json` file in the repository
5. `wrangler.toml` is in `web/` directory

### Error: "No wrangler.toml file found"

**Check**:
1. `wrangler.toml` exists in `web/` directory
2. Cloudflare Pages Root Directory is set to `web` (so it looks in the right place)

### Error: "vercel build must not recursively invoke itself"

**Check**:
1. `web/package.json` has `"build": "TURBOPACK=0 next build"` (NOT `next-on-pages`)
2. `web/package.json` has `"build:cf": "TURBOPACK=0 npx @cloudflare/next-on-pages@1"` (separate script)

## Verification Checklist

After configuring:

- [ ] Root `package.json` does NOT have `build:cf` script with `cd web &&`
- [ ] `web/package.json` has `build` = `TURBOPACK=0 next build`
- [ ] `web/package.json` has `build:cf` = `TURBOPACK=0 npx @cloudflare/next-on-pages@1`
- [ ] Cloudflare Pages Root Directory = `web`
- [ ] Cloudflare Pages Build Command = `pnpm run build:cf`
- [ ] Cloudflare Pages Build Output Directory = `.vercel/output/static`
- [ ] `TURBOPACK=0` environment variable is set
- [ ] No `.vercel` folder or `vercel.json` file in repository
- [ ] `wrangler.toml` is in `web/` directory
- [ ] Build logs show paths like `/opt/buildhome/repo/web/.next` (NOT `/web/web/.next`)
