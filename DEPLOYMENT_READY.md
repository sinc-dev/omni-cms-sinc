# Deployment Checklist - Ready for Cloudflare

## ✅ Pre-Deployment Checklist

### Code Status
- ✅ All linter errors fixed
- ✅ API routes migrated to Hono backend
- ✅ Frontend updated to use API client
- ✅ TypeScript compilation passes
- ✅ Monorepo structure configured

### Configuration Files
- ✅ `apps/api/wrangler.toml` - API Worker config
- ✅ `apps/web/wrangler.toml` - Web Pages config
- ✅ `apps/web/package.json` - Build scripts configured
- ✅ `apps/api/package.json` - Deploy scripts configured

## 🚀 Deployment Steps

### Step 1: Deploy API Backend (Cloudflare Workers)

```bash
cd apps/api

# 1. Install dependencies (if not already done)
pnpm install

# 2. Deploy the API Worker
pnpm run deploy
# OR from root:
pnpm run deploy:api
```

**Expected Output:**
- Worker deployed to: `https://api-<random>.workers.dev`
- Or custom domain if configured

**Required Environment Variables** (set in Cloudflare Dashboard → Workers → Settings → Variables):
- `CF_ACCESS_TEAM_DOMAIN` - Your Cloudflare Access team domain
- `CF_ACCESS_AUD` - Your Cloudflare Access AUD tag
- `R2_ACCOUNT_ID` - Your R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `R2_PUBLIC_URL` - Optional: Custom domain for media

**Bindings** (configured in `wrangler.toml`):
- ✅ D1 Database: `DB` → `omni-cms` (ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`)
- ✅ R2 Bucket: `R2_BUCKET` → `omni-cms-media`

### Step 2: Deploy Web Frontend (Cloudflare Pages)

```bash
cd apps/web

# 1. Install dependencies (if not already done)
pnpm install

# 2. Build for Cloudflare Pages
pnpm run build:cf
# OR from root:
pnpm run deploy:web
```

**Then deploy the output:**

**Option A: Using Wrangler CLI**
```bash
# From apps/web directory
wrangler pages deploy .vercel/output/static --project-name=omni-cms-web
```

**Option B: Using Git Integration (Recommended)**
1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect your Git repository
3. Configure build settings:
   - **Build command**: `cd apps/web && pnpm install && pnpm run build:cf`
   - **Build output directory**: `apps/web/.vercel/output/static`
   - **Root directory**: `/` (repository root)
   - **Node version**: `20`
4. Set environment variables (see below)
5. Deploy

**Required Environment Variables** (set in Cloudflare Dashboard → Pages → Settings → Environment Variables):

**Production:**
- `NEXT_PUBLIC_API_URL` - Your API Worker URL (e.g., `https://api-<random>.workers.dev`)
- `NEXT_PUBLIC_APP_URL` - Your Pages URL (e.g., `https://omni-cms-web.pages.dev`)
- `CF_ACCESS_TEAM_DOMAIN` - Your Cloudflare Access team domain
- `CF_ACCESS_AUD` - Your Cloudflare Access AUD tag
- `R2_ACCOUNT_ID` - Your R2 account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `R2_PUBLIC_URL` - Optional: Custom domain for media

**Bindings** (configured in `wrangler.toml`):
- ✅ D1 Database: `DB` → `omni-cms` (ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`)
- ✅ R2 Bucket: `R2_BUCKET` → `omni-cms-media`

### Step 3: Run Database Migrations

**For API Worker:**
```bash
cd apps/api
pnpm run db:migrate:prod
```

**For Web Pages:**
```bash
cd apps/web
pnpm run db:migrate:prod
```

**Note:** Both use the same D1 database, so you only need to run migrations once.

### Step 4: Verify Deployment

**API Health Check:**
```bash
curl https://your-api-worker-url.workers.dev/health
# Should return: {"status":"ok","service":"omni-cms-api"}
```

**Web Frontend:**
- Visit your Pages URL
- Check browser console for errors
- Verify API calls are working

**Test API Key Authentication:**
```bash
# Create an API key via admin panel
# Then test with:
curl -H "Authorization: Bearer <your-api-key>" \
  https://your-api-worker-url.workers.dev/api/admin/v1/organizations/<orgId>/posts
```

## 📋 Post-Deployment Checklist

- [ ] API Worker deployed and accessible
- [ ] Web Pages deployed and accessible
- [ ] Database migrations applied
- [ ] Environment variables set in both Workers and Pages
- [ ] D1 and R2 bindings configured
- [ ] API health check returns OK
- [ ] Frontend can connect to API
- [ ] Authentication working (Cloudflare Access)
- [ ] API key authentication working
- [ ] Media uploads working (R2)
- [ ] Database queries working (D1)

## 🔧 Troubleshooting

### API Worker Issues

**Error: "Cannot find module"**
- Ensure all dependencies are installed: `cd apps/api && pnpm install`
- Check `package.json` has all required dependencies

**Error: "Database binding not found"**
- Verify `wrangler.toml` has correct D1 binding
- Check database ID matches in Cloudflare Dashboard

**Error: "R2 binding not found"**
- Verify `wrangler.toml` has correct R2 binding
- Check bucket name matches in Cloudflare Dashboard

### Web Pages Issues

**Error: "Build failed"**
- Check Node version is 20
- Verify all dependencies installed: `cd apps/web && pnpm install`
- Check build logs in Cloudflare Dashboard

**Error: "API calls failing"**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS settings in API Worker
- Verify API Worker is deployed and accessible

**Error: "Authentication not working"**
- Verify `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are set
- Check Cloudflare Access application is configured
- Verify application domain matches Pages URL

## 🎯 Quick Deploy Commands

**Deploy Everything:**
```bash
# From repository root
pnpm run deploy:all
```

**Deploy API Only:**
```bash
pnpm run deploy:api
```

**Deploy Web Only:**
```bash
pnpm run deploy:web
```

## 📝 Notes

- **API URL**: After deploying the API Worker, update `NEXT_PUBLIC_API_URL` in Pages environment variables
- **Custom Domains**: Configure custom domains in Cloudflare Dashboard for both Workers and Pages
- **Environment Variables**: Some variables are needed in both Workers and Pages (like R2 credentials)
- **Database**: Both API and Web use the same D1 database, so migrations only need to run once

