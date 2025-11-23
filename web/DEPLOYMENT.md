# Cloudflare Pages Deployment Guide

This guide covers deploying Omni-CMS to Cloudflare Pages.

## Prerequisites

1. Cloudflare account with Pages, D1, and R2 enabled
2. Wrangler CLI installed and authenticated (`wrangler login`)
3. Database migration applied to production

## Pre-Deployment Steps

### 1. Apply Database Migration

Before deploying, apply the database migration to production:

```bash
pnpm db:migrate:prod
```

This applies the migration `0001_oval_stranger.sql` which adds:
- `post_shares` table
- `organization_id`, `api_key_id`, and `metadata` columns to `analytics_events`
- `scopes`, `revoked_at`, and `rotated_from_id` columns to `api_keys`
- `share_count` column to `posts`

**Note**: SQLite doesn't support adding foreign keys via ALTER TABLE. The foreign key constraints in the migration are documented but may need manual setup if required.

### 2. Verify Build

The build has been verified and passes successfully:

```bash
pnpm build
```

All admin pages are configured as dynamic routes to prevent build-time errors.

## Cloudflare Pages Configuration

### 1. Create Cloudflare Pages Project

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `.next` (or verify Next.js output)
   - **Root directory**: `web` (if monorepo)

### 2. Configure D1 Database Binding

In Cloudflare Pages project settings:

1. Go to Settings → Functions
2. Add D1 database binding:
   - **Variable name**: `DB`
   - **Database**: Select `omni-cms` (or create if needed)
   - **Database ID**: `12aad490-4c2d-4cdb-b07f-0f536e20e994` (from wrangler.toml)

### 3. Configure R2 Bucket Binding

In Cloudflare Pages project settings:

1. Go to Settings → Functions
2. Add R2 bucket binding:
   - **Variable name**: `R2_BUCKET`
   - **Bucket**: `omni-cms-media` (or create if needed)

### 4. Set Environment Variables

In Cloudflare Pages project settings → Environment Variables, set:

**Required:**
- `CF_ACCESS_TEAM_DOMAIN` - Your Cloudflare Access team domain
- `CF_ACCESS_AUD` - Your Cloudflare Access audience tag
- `R2_ACCOUNT_ID` - Your R2 account ID
- `R2_ACCESS_KEY_ID` - Your R2 access key ID
- `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- `R2_BUCKET_NAME` - `omni-cms-media`
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.pages.dev`)

**Optional:**
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_PUBLIC_URL` - Custom domain for R2 media (if using)

### 5. Build Configuration

The project uses Next.js 16.0.3. Cloudflare Pages should automatically detect and configure Next.js.

**Note**: If you encounter issues, you may need to install `@cloudflare/next-on-pages` adapter:

```bash
pnpm add -D @cloudflare/next-on-pages
```

Then update `package.json` build script:
```json
"build": "next build && npx @cloudflare/next-on-pages"
```

## Deployment

### Automatic Deployment (GitHub Integration)

1. Push to your main branch
2. Cloudflare Pages will automatically build and deploy
3. Monitor the deployment in the Cloudflare dashboard

### Manual Deployment

```bash
# Build locally
pnpm build

# Deploy using Wrangler (if configured)
wrangler pages deploy .next
```

## Post-Deployment Verification

### 1. Verify Application Loads

- Visit your Cloudflare Pages URL
- Verify the homepage loads correctly
- Check browser console for errors

### 2. Test Authentication

- Test login flow
- Verify Cloudflare Access integration works
- Test organization selection

### 3. Test API Endpoints

- Test admin API endpoints (requires authentication)
- Test public API endpoints
- Verify API key authentication works

### 4. Test Database Connections

- Create a test post
- Verify data persists in D1
- Check analytics tracking works

### 5. Test R2 Media Uploads

- Upload a media file
- Verify file is stored in R2
- Test media retrieval

### 6. Test Key Features

- ✅ Advanced search API
- ✅ API key management and rotation
- ✅ Analytics tracking
- ✅ Post sharing
- ✅ Content blocks
- ✅ Templates
- ✅ Webhooks
- ✅ Workflow (reviews)

## Troubleshooting

### Build Failures

- Check build logs in Cloudflare Pages dashboard
- Verify all environment variables are set
- Ensure Node.js version is compatible (check `package.json` engines)

### Database Issues

- Verify D1 database binding is configured
- Check database migration was applied
- Review D1 database in Cloudflare dashboard

### R2 Issues

- Verify R2 bucket binding is configured
- Check R2 credentials are correct
- Ensure bucket exists and is accessible

### Runtime Errors

- Check Cloudflare Pages Functions logs
- Review browser console for client-side errors
- Verify all environment variables are set correctly

## Environment Variables Reference

See `env.example` for all available environment variables and their descriptions.

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

