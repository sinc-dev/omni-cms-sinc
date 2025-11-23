# Deployment Checklist - Action Required NOW

## ✅ Completed (Just Now)
- ✅ Code committed and pushed to GitHub
- ✅ Build configuration updated with `@cloudflare/next-on-pages` adapter
- ✅ `wrangler.toml` updated to match project name
- ✅ Cloudflare Pages will automatically start building

## ⚠️ CRITICAL: Complete These Before Deployment Succeeds

### 1. Fix Deploy Command (MUST DO FIRST)

**Go to**: Cloudflare Dashboard → Pages → omni-cms-sinc → Settings → Builds & deployments

**Set Deploy Command to**:
```
npx wrangler pages deploy .vercel/output/static
```

**Current Status**: The build will likely fail until this is fixed.

### 2. Configure Bindings (Required for Runtime)

**Go to**: Settings → Functions

**Add D1 Binding:**
- Variable: `DB`
- Database: `omni-cms`
- Database ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`

**Add R2 Binding:**
- Variable: `R2_BUCKET`
- Bucket: `omni-cms-media`

### 3. Set Environment Variables (Required for Runtime)

**Go to**: Settings → Environment Variables → Production

**Add these variables:**
- `CF_ACCESS_TEAM_DOMAIN` - From Zero Trust → Access
- `CF_ACCESS_AUD` - From Zero Trust → Access → Applications
- `R2_ACCOUNT_ID` - From R2 dashboard
- `R2_ACCESS_KEY_ID` - From R2 API tokens
- `R2_SECRET_ACCESS_KEY` - From R2 API tokens
- `R2_BUCKET_NAME` = `omni-cms-media`
- `NEXT_PUBLIC_APP_URL` = Your Pages URL (e.g., `https://omni-cms-sinc.pages.dev`)

## 📊 Deployment Status

**Current**: Cloudflare Pages is building (check dashboard for progress)

**Next Steps**:
1. Fix deploy command (see above)
2. Configure bindings
3. Set environment variables
4. If build fails, check logs and fix issues
5. Once deployed, apply migrations: `cd web && pnpm db:migrate:prod`

## 🔗 Quick Links

- [Cloudflare Pages Dashboard](https://dash.cloudflare.com/?to=/:account/pages)
- [Zero Trust / Access](https://one.dash.cloudflare.com/)
- [R2 Dashboard](https://dash.cloudflare.com/?to=/:account/r2)
- [D1 Dashboard](https://dash.cloudflare.com/?to=/:account/workers/d1)

