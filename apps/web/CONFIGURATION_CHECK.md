# Configuration Check Guide

If you're seeing an "Internal Server Error" after logging in, follow these steps to diagnose and fix the issue.

## Quick Diagnosis

1. **Check Cloudflare Pages Logs**
   - Go to Cloudflare Dashboard → Pages → omni-cms-sinc
   - Click on the latest deployment
   - View the logs to see the specific error message

2. **Verify Database Binding**
   - Go to Pages → Settings → Functions
   - Check if D1 Database binding exists:
     - Variable name: `DB`
     - Database: `omni-cms`
     - Database ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`
   - If missing, add it

3. **Verify Environment Variables**
   - Go to Pages → Settings → Environment Variables → Production
   - Check for these required variables:
     - `CF_ACCESS_TEAM_DOMAIN` (e.g., `sincdev.cloudflareaccess.com`)
     - `CF_ACCESS_AUD` (the long string from Cloudflare Access)
     - `NEXT_PUBLIC_APP_URL` (e.g., `https://omni-cms-sinc.pages.dev`)
   - If missing, add them

4. **Check Database Migrations**
   - Run: `wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"`
   - If no tables exist, run migrations:
     ```bash
     cd apps/web
     pnpm db:migrate:prod
     ```

## Common Error Messages

### "Database not configured"
- **Fix**: Add D1 database binding in Cloudflare Pages Settings → Functions
- Variable name must be exactly `DB`

### "Cloudflare Access not configured"
- **Fix**: Add `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` environment variables
- Get these from Cloudflare Zero Trust → Access → Applications

### "Table does not exist"
- **Fix**: Run database migrations
- See step 4 above

## After Making Changes

1. Redeploy the Pages site (or wait for automatic deployment)
2. Clear your browser cache
3. Try accessing the site again

## Still Having Issues?

Check the Cloudflare Pages deployment logs for the exact error message. The error page will show helpful configuration hints if it detects common issues.

