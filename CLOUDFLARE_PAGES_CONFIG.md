# Cloudflare Pages Configuration Guide

## Complete Setup for Web Frontend (Cloudflare Pages)

### Step 1: Create/Configure Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Pages**
2. Click **Create a project** (or select existing project)
3. Connect your Git repository: `sinc-dev/omni-cms-sinc`

### Step 2: Build Configuration

**Project name:** `omni-cms-web` (or your preferred name)

**Root directory:** `apps/web`

**Build command:**
```bash
pnpm install && pnpm run build:cf
```

**Build output directory:** `.vercel/output/static`

**Node version:** `20` (or `22`)

**Environment variables:** See Step 3 below

### Step 3: Environment Variables

Go to **Settings** → **Environment Variables** → **Production** (and Preview if needed)

**Required Variables:**

```bash
# API Backend URL (update after deploying API Worker)
NEXT_PUBLIC_API_URL=https://omni-cms-api.<your-subdomain>.workers.dev

# Frontend URL
NEXT_PUBLIC_APP_URL=https://omni-cms-web.pages.dev

# Cloudflare Access (for admin authentication)
CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CF_ACCESS_AUD=your-access-aud-tag

# R2 Storage (for media uploads)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=omni-cms-media
R2_PUBLIC_URL=https://media.yourdomain.com  # Optional: custom domain
```

### Step 4: Functions Configuration (Bindings)

Go to **Settings** → **Functions** → **Bindings**

#### D1 Database Binding

1. Scroll to **D1 Database bindings**
2. Click **Add binding**
3. Configure:
   - **Variable name:** `DB`
   - **Database:** Select `omni-cms` (or create new)
   - **Database ID:** `12aad490-4c2d-4cdb-b07f-0f536e20e994`

#### R2 Bucket Binding

1. Scroll to **R2 Bucket bindings**
2. Click **Add binding**
3. Configure:
   - **Variable name:** `R2_BUCKET`
   - **Bucket:** Select `omni-cms-media` (or create new)

### Step 5: Custom Domain (Optional)

1. Go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `cms.yourdomain.com`)
4. Follow DNS configuration instructions

### Step 6: Deployment Settings

**Auto-deploy:** Enabled (deploys on push to main branch)

**Preview deployments:** Enabled (creates preview for pull requests)

**Build caching:** Enabled (faster rebuilds)

### Step 7: Post-Deployment

After first successful deployment:

1. **Update `NEXT_PUBLIC_API_URL`** with your actual API Worker URL
2. **Run database migrations:**
   ```bash
   cd apps/web
   pnpm run db:migrate:prod
   ```
3. **Verify deployment:**
   - Visit your Pages URL
   - Check browser console for errors
   - Test API connectivity

## Quick Reference

### Build Settings Summary

| Setting | Value |
|---------|-------|
| **Root directory** | `apps/web` |
| **Build command** | `pnpm install && pnpm run build:cf` |
| **Build output directory** | `.vercel/output/static` |
| **Node version** | `20` |
| **Framework preset** | `Next.js` (optional) |

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_API_URL` - API Worker URL
- [ ] `NEXT_PUBLIC_APP_URL` - Pages URL
- [ ] `CF_ACCESS_TEAM_DOMAIN` - Cloudflare Access team
- [ ] `CF_ACCESS_AUD` - Cloudflare Access AUD tag
- [ ] `R2_ACCOUNT_ID` - R2 account ID
- [ ] `R2_ACCESS_KEY_ID` - R2 access key
- [ ] `R2_SECRET_ACCESS_KEY` - R2 secret key
- [ ] `R2_BUCKET_NAME` - `omni-cms-media`
- [ ] `R2_PUBLIC_URL` - Optional: custom media domain

### Bindings Checklist

- [ ] D1 Database: `DB` → `omni-cms`
- [ ] R2 Bucket: `R2_BUCKET` → `omni-cms-media`

## Troubleshooting

### Build Fails

**Error: "Cannot find module"**
- Ensure `Root directory` is set to `apps/web`
- Check that `pnpm install` runs before build

**Error: "Turbopack build failed"**
- Build command uses `--webpack` flag (already configured)
- Check `next.config.ts` has `turbopack: { root }` config

**Error: "Build output directory not found"**
- Verify output directory: `.vercel/output/static`
- Check `wrangler.toml` has `pages_build_output_dir` set

### Runtime Errors

**Error: "API calls failing"**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check API Worker is deployed and accessible
- Verify CORS settings in API Worker

**Error: "Database binding not found"**
- Check D1 binding is configured in Functions settings
- Verify database ID matches `wrangler.toml`

**Error: "R2 binding not found"**
- Check R2 binding is configured in Functions settings
- Verify bucket name matches `wrangler.toml`

## Notes

- The `wrangler.toml` file in `apps/web` is automatically detected by Cloudflare Pages
- Build output directory is configured in `wrangler.toml`: `pages_build_output_dir = ".vercel/output/static"`
- Environment variables set in Dashboard override `.env` files
- Bindings configured in Dashboard override `wrangler.toml` bindings

