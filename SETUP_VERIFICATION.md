# Setup Verification Guide

This guide helps you verify that your Cloudflare Pages deployment is properly configured after encountering an "Internal Server Error".

## Step 1: Check Cloudflare Pages Logs

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Pages** → **omni-cms-sinc**
3. Click on the latest deployment
4. Click **View logs** or check the **Functions logs** tab
5. Look for error messages that indicate what's missing

Common error patterns:
- `Database not configured` → Missing D1 binding
- `Cloudflare Access not configured` → Missing environment variables
- `Table does not exist` → Database migrations not applied

## Step 2: Verify Database Bindings

### D1 Database Binding

1. In Cloudflare Pages → **omni-cms-sinc** → **Settings** → **Functions**
2. Scroll to **D1 Database bindings**
3. Verify or add:
   - **Variable name**: `DB` (must be exactly this)
   - **Database**: `omni-cms`
   - **Database ID**: `12aad490-4c2d-4cdb-b07f-0f536e20e994`

If missing:
- Click **Add binding**
- Fill in the values above
- Click **Save**

### R2 Bucket Binding (Optional but recommended)

1. In the same **Functions** section
2. Scroll to **R2 Bucket bindings**
3. Verify or add:
   - **Variable name**: `R2_BUCKET`
   - **Bucket**: `omni-cms-media`

## Step 3: Verify Environment Variables

1. Go to **Settings** → **Environment Variables** → **Production**
2. Verify these required variables exist:

### Required Variables

- **CF_ACCESS_TEAM_DOMAIN**
  - Value: Your Cloudflare Access team domain (e.g., `sincdev.cloudflareaccess.com`)
  - Where to find: Cloudflare Zero Trust → Access → Applications → Look at the URL or team name

- **CF_ACCESS_AUD**
  - Value: Your Access Application Audience tag (long string)
  - Where to find: Cloudflare Zero Trust → Access → Applications → Click your app → Application Audience (AUD) Tag

### Recommended Variables

- **NEXT_PUBLIC_APP_URL**
  - Value: `https://omni-cms-sinc.pages.dev` (or your custom domain)
  - Used for generating absolute URLs

- **R2_ACCOUNT_ID**
  - Value: Your R2 account ID
  - Where to find: R2 Dashboard → Account ID

- **R2_BUCKET_NAME**
  - Value: `omni-cms-media`

- **R2_ACCESS_KEY_ID** and **R2_SECRET_ACCESS_KEY**
  - Where to find: R2 Dashboard → Manage R2 API Tokens

## Step 4: Check Database State

Run this command to check if database tables exist:

```bash
wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"
```

If no tables are returned, apply migrations:

```bash
cd apps/web
pnpm db:migrate:prod
```

This will create all required tables including the `users` table needed for auto-provisioning.

## Step 5: Verify Database Migrations

Check if the `users` table exists (required for authentication):

```bash
wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table' AND name='users';"
```

If it returns a row, the table exists. If not, run migrations as shown in Step 4.

## Step 6: Redeploy

After making configuration changes:

1. The site will automatically redeploy if connected to Git
2. Or manually trigger a deployment in the Pages dashboard
3. Wait for the deployment to complete
4. Clear your browser cache
5. Try accessing the site again

## Troubleshooting

### Still seeing "Internal Server Error"?

1. **Check the specific error in logs** (Step 1)
2. **Verify all bindings are saved** - Sometimes changes need a moment to propagate
3. **Check environment variable names** - They must match exactly (case-sensitive)
4. **Verify database ID** - Must match the actual D1 database ID in your account
5. **Check deployment status** - Make sure the latest deployment succeeded

### Common Issues

**Issue**: "Database not configured" error
- **Solution**: Add D1 binding in Functions settings (Step 2)

**Issue**: "Cloudflare Access not configured" error  
- **Solution**: Add CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD variables (Step 3)

**Issue**: "User not found" or authentication fails
- **Solution**: Check database migrations are applied (Step 4)
- The `users` table must exist for auto-provisioning to work

**Issue**: Page loads but features don't work
- **Solution**: Check R2 bindings and environment variables (Steps 2-3)

## Quick Checklist

Before reporting issues, verify:

- [ ] D1 database binding `DB` is configured
- [ ] Environment variable `CF_ACCESS_TEAM_DOMAIN` is set
- [ ] Environment variable `CF_ACCESS_AUD` is set
- [ ] Database migrations have been applied
- [ ] Latest deployment succeeded
- [ ] Browser cache has been cleared

## Getting Help

If you've completed all steps and still have issues:

1. Copy the exact error message from Cloudflare Pages logs
2. Note which step failed during verification
3. Check the error page on the site - it may show helpful configuration hints

