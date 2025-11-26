# Quick Fix Guide for Internal Server Error

If you're seeing an "Internal Server Error" after logging in, follow these steps in order:

## Immediate Actions Required

### 1. Add D1 Database Binding

**Location**: Cloudflare Dashboard → Pages → omni-cms-sinc → Settings → Functions

1. Scroll to **D1 Database bindings** section
2. Click **Add binding** (if no binding exists)
3. Configure:
   - **Variable name**: `DB` (must be exactly this, case-sensitive)
   - **Database**: Select `omni-cms` from dropdown
   - **Database ID**: `12aad490-4c2d-4cdb-b07f-0f536e20e994`
4. Click **Save**

### 2. Add Environment Variables

**Location**: Cloudflare Dashboard → Pages → omni-cms-sinc → Settings → Environment Variables → Production

Add these variables:

#### Required:
- **CF_ACCESS_TEAM_DOMAIN** = `your-team.cloudflareaccess.com` (get from Cloudflare Zero Trust → Access)
- **CF_ACCESS_AUD** = `your-access-aud-here` (get from Cloudflare Zero Trust → Access → Applications)

#### Recommended:
- **NEXT_PUBLIC_APP_URL** = `https://omni-cms-sinc.pages.dev`

### 3. Apply Database Migrations

Run this command locally (if you have wrangler configured):

```bash
cd apps/web
pnpm db:migrate:prod
```

Or manually check if tables exist:

```bash
wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"
```

If no tables are returned, the migrations need to be applied.

### 4. Redeploy

After making changes:
1. The site will auto-redeploy if connected to Git, OR
2. Manually trigger a new deployment in the Pages dashboard
3. Wait for deployment to complete
4. Clear browser cache
5. Try accessing the site again

## What We Fixed in Code

1. ✅ Made root page a client component to avoid server-side errors
2. ✅ Added better error messages for configuration issues
3. ✅ Improved database client error handling
4. ✅ Added configuration check utilities

## Verification

After completing the steps above, the error page will now show helpful messages if configuration is still missing. Check the Cloudflare Pages logs for specific error details.

## Still Having Issues?

See `SETUP_VERIFICATION.md` for detailed troubleshooting steps.

