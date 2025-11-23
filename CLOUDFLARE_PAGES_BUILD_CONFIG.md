# Cloudflare Pages Build Configuration - Final Solution

## Root Cause

The `web/web/.next` path error occurs because of a **path resolution conflict** between Cloudflare Pages, your monorepo structure, and the `@cloudflare/next-on-pages` builder.

**The Problem:**
- Cloudflare clones your repo to `/opt/buildhome/repo`
- If Root Directory is set to `web`, Cloudflare runs commands from `/opt/buildhome/repo/web`
- The builder detects it's inside a git repository and tries to resolve paths relative to the git root
- Because the command is running *inside* `/web`, it appends `/web` again, looking for `/web/web/.next`
- Result: `/opt/buildhome/repo/web/web/.next/routes-manifest.json` → **ENOENT error**

## Final Solution: Use Repository Root

### 1. Cloudflare Pages Dashboard Settings

Go to **Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments → Build configurations** and set:

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `None` (or `Next.js`) |
| **Root directory** | `/` (Leave blank or set to root) ⚠️ **CRITICAL** |
| **Build command** | `pnpm --filter web run build:cf` ⚠️ **MUST use this** |
| **Build output directory** | `web/.vercel/output/static` ⚠️ **MUST include `web/` prefix** |

**Why this works:**
- By setting Root Directory to `/`, Cloudflare sees the entire monorepo structure (including `pnpm-workspace.yaml`)
- The `pnpm --filter web` command tells pnpm to specifically run the script inside the `web` folder
- File paths remain absolute and correct, preventing the "double web" error
- Output directory `web/.vercel/output/static` is relative to repo root, which is correct

### 2. Root `package.json` Configuration

Keep it simple (already correct):

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

### 3. `web/package.json` Configuration

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

### 4. `web/next.config.ts` Configuration

**CRITICAL**: Ensure you do **NOT** have `output: 'export'` or `output: 'standalone'` in your config. `@cloudflare/next-on-pages` expects the standard default output to process.

```typescript
import type { NextConfig } from "next";
import path from "node:path";

const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // DO NOT set output to 'export' or 'standalone'
  // output: 'standalone', // <--- DELETE THIS if present
  // output: 'export',    // <--- DELETE THIS if present
  
  outputFileTracingRoot: root,
  turbopack: {
    root,
  },
  
  // Image optimization for Cloudflare
  images: {
    unoptimized: true, // Recommended for Cloudflare unless using a paid image loader
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  
  // ... rest of config
};

export default nextConfig;
```

### 5. `wrangler.toml` Location

The `wrangler.toml` file should be in the `web/` directory:

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

**Note**: The `pages_build_output_dir` in `wrangler.toml` is relative to the `web/` directory, so `.vercel/output/static` is correct. Cloudflare Pages will look for `web/.vercel/output/static` relative to the repo root.

### 6. Ensure No Vercel Config Files

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

## Required Environment Variables

**Variable**: `TURBOPACK`  
**Value**: `0`  
**Environment**: Production (and Preview)

**Location**: Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables

## R2 Storage Configuration (Optional but Recommended)

Your logs show this warning:
```
Missing R2 environment variables. Media upload will not work.
```

While this won't break the build, your app will crash if it tries to upload files.

### Setup R2 Bindings in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard → Pages → Your Project → Settings → Functions**
2. Scroll to **R2 Object Storage Bindings**
3. Click **Add binding**
4. Configure:
   - **Variable name**: `R2_BUCKET` (Must match your `wrangler.toml`)
   - **Bucket**: `omni-cms-media`
5. Save

**Note**: Cloudflare Pages does **not** read bindings from `wrangler.toml` during the build process; it only uses the dashboard settings for the deployed environment.

### R2 Environment Variables (if needed by your code)

If your code expects R2 environment variables, add them in:
**Cloudflare Dashboard → Pages → Your Project → Settings → Environment Variables**

- `R2_ACCOUNT_ID` - Your R2 account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `R2_PUBLIC_URL` - Optional: Custom domain for R2 media

## Build Flow (Correct)

1. Cloudflare Pages sets Root Directory to `/` (repo root)
2. Cloudflare runs `pnpm --filter web run build:cf` from `/opt/buildhome/repo`
3. `pnpm --filter web` changes to `web/` directory and runs `build:cf` script
4. `build:cf` script runs `TURBOPACK=0 npx @cloudflare/next-on-pages@1`
5. `next-on-pages` internally runs `vercel build`
6. `vercel build` calls the `build` script (`TURBOPACK=0 next build`)
7. Next.js creates `.next` at `/opt/buildhome/repo/web/.next` ✅
8. Adapter processes output and generates `.vercel/output/static` in `web/` directory ✅
9. Cloudflare Pages finds output at `web/.vercel/output/static` relative to repo root ✅

## Troubleshooting

### Error: `web/web/.next` path not found

**Check**:
1. Cloudflare Pages Root Directory is set to `/` (NOT `web`)
2. Cloudflare Pages Build Command is `pnpm --filter web run build:cf` (NOT `pnpm run build:cf`)
3. Cloudflare Pages Build Output Directory is `web/.vercel/output/static` (NOT `.vercel/output/static`)
4. Root `package.json` does NOT have `"build:cf": "cd web && ..."`
5. No `.vercel` folder or `vercel.json` file in the repository
6. `wrangler.toml` is in `web/` directory

### Error: "No wrangler.toml file found"

**Check**:
1. `wrangler.toml` exists in `web/` directory
2. Cloudflare Pages Root Directory is set to `/` (so it can find `web/wrangler.toml`)

### Error: "vercel build must not recursively invoke itself"

**Check**:
1. `web/package.json` has `"build": "TURBOPACK=0 next build"` (NOT `next-on-pages`)
2. `web/package.json` has `"build:cf": "TURBOPACK=0 npx @cloudflare/next-on-pages@1"` (separate script)

### Error: "Build output directory not found"

**Check**:
1. Build Output Directory is set to `web/.vercel/output/static` (with `web/` prefix)
2. The build completed successfully and generated `.vercel/output/static` in the `web/` directory

## Verification Checklist

After configuring:

- [ ] Cloudflare Pages Root Directory = `/` (repo root, NOT `web`)
- [ ] Cloudflare Pages Build Command = `pnpm --filter web run build:cf`
- [ ] Cloudflare Pages Build Output Directory = `web/.vercel/output/static`
- [ ] Root `package.json` does NOT have `build:cf` script with `cd web &&`
- [ ] `web/package.json` has `build` = `TURBOPACK=0 next build`
- [ ] `web/package.json` has `build:cf` = `TURBOPACK=0 npx @cloudflare/next-on-pages@1`
- [ ] `web/next.config.ts` does NOT have `output: 'export'` or `output: 'standalone'`
- [ ] `TURBOPACK=0` environment variable is set
- [ ] No `.vercel` folder or `vercel.json` file in repository
- [ ] `wrangler.toml` is in `web/` directory
- [ ] R2 binding is configured in Cloudflare Dashboard (if using media upload)
- [ ] Build logs show paths like `/opt/buildhome/repo/web/.next` (NOT `/web/web/.next`)
- [ ] Build completes successfully and output is found at `web/.vercel/output/static`
