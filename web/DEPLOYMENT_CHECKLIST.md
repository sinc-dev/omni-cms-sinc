# Cloudflare Deployment Checklist

## Pre-Deployment Requirements

### 1. Build Verification ✅
- [x] Production build succeeds: `pnpm build`
- [x] No TypeScript errors
- [x] All pages compile correctly

### 2. Next.js Cloudflare Compatibility ✅
**Status**: Next.js 16.0.3 is used with `@cloudflare/next-on-pages` adapter.

**Root Cause Fix**: Vercel configuration files (`.vercel` folder and `vercel.json`) have been removed from the repository. This was causing the `web/web/.next` path error.

**Build Configuration**:
- **Root Directory**: `web`
- **Build Command**: `pnpm run build`
- **Build Output Directory**: `.vercel/output/static`

**The `build` script is configured** in `web/package.json`:
```json
"build": "TURBOPACK=0 npx @cloudflare/next-on-pages@1"
```

**Why this works**: 
- Without Vercel config files, `vercel build` treats the current directory (`/opt/buildhome/repo/web`) as project root
- `.next` is created at `/opt/buildhome/repo/web/.next` ✅
- No double `web/web/.next` path issue ✅

### 3. Database Migration ✅
Migration file: `drizzle/migrations/0001_oval_stranger.sql`

**Migration includes:**
- `post_shares` table
- `organization_id`, `api_key_id`, `metadata` columns to `analytics_events`
- `scopes`, `revoked_at`, `rotated_from_id` columns to `api_keys`
- `share_count` column to `posts`
- Indexes for performance

**To apply migration:**
```bash
pnpm db:migrate:prod
```

### 4. Environment Variables (Cloudflare Pages Dashboard)

#### Required Variables:
- [ ] `CF_ACCESS_TEAM_DOMAIN` - Your Cloudflare Access team domain (e.g., `your-team.cloudflareaccess.com`)
- [ ] `CF_ACCESS_AUD` - Your Cloudflare Access audience tag
- [ ] `R2_ACCOUNT_ID` - Your R2 account ID
- [ ] `R2_ACCESS_KEY_ID` - Your R2 access key ID
- [ ] `R2_SECRET_ACCESS_KEY` - Your R2 secret access key
- [ ] `R2_BUCKET_NAME` - `omni-cms-media`
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (e.g., `https://your-app.pages.dev`)

#### Optional Variables:
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- [ ] `R2_PUBLIC_URL` - Custom domain for R2 media (if using)

### 5. Cloudflare Resources

#### D1 Database:
- [ ] Database name: `omni-cms`
- [ ] Database ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994` (from `wrangler.toml`)
- [ ] Migration applied: `pnpm db:migrate:prod`
- [ ] Default roles seeded (if needed)

#### R2 Bucket:
- [ ] Bucket name: `omni-cms-media`
- [ ] Bucket exists and is accessible
- [ ] CORS configured (if needed for public access)

#### Cloudflare Access:
- [ ] Access configured for your domain
- [ ] Identity providers set up (Google, GitHub, Email OTP, etc.)
- [ ] Application policies configured

### 6. Cloudflare Pages Configuration

#### Project Setup:
- [ ] Pages project created in Cloudflare dashboard
- [ ] GitHub repository connected
- [ ] Build settings configured:
  - Build command: `pnpm build`
  - Build output directory: `.next` (verify Next.js 16 output)
  - Root directory: `web` (if monorepo)
  - Node.js version: 20.x (or latest LTS)

#### Bindings:
- [ ] D1 database binding:
  - Variable name: `DB`
  - Database: `omni-cms`
  - Database ID: `12aad490-4c2d-4cdb-b07f-0f536e20e994`
- [ ] R2 bucket binding:
  - Variable name: `R2_BUCKET`
  - Bucket: `omni-cms-media`

## Post-Deployment Verification

### 1. Application Health
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] All static assets load
- [ ] No 404 errors for expected routes

### 2. Authentication
- [ ] Cloudflare Access login works
- [ ] Organization selection works
- [ ] User session persists
- [ ] Logout works correctly

### 3. Database
- [ ] Can create a test post
- [ ] Data persists in D1
- [ ] Queries return correct data
- [ ] Analytics tracking works

### 4. Media Upload
- [ ] Can upload media file
- [ ] File stored in R2
- [ ] Media retrieval works
- [ ] Media URLs are accessible

### 5. API Endpoints
- [ ] Admin API endpoints work (with auth)
- [ ] Public API endpoints work
- [ ] API key authentication works
- [ ] Advanced search API works
- [ ] Schema endpoints work

### 6. Key Features
- [ ] Post creation/editing
- [ ] Custom fields work
- [ ] Taxonomies work
- [ ] Media library works
- [ ] API key management works
- [ ] Analytics tracking works
- [ ] Post sharing works
- [ ] Content blocks work
- [ ] Templates work
- [ ] Webhooks work
- [ ] Workflow (reviews) works

## Troubleshooting

### Build Failures
- Check build logs in Cloudflare Pages dashboard
- Verify all environment variables are set
- Ensure Node.js version is compatible (check `package.json` engines)
- Check for TypeScript errors locally first

### Database Issues
- Verify D1 database binding is configured
- Check database migration was applied
- Review D1 database in Cloudflare dashboard
- Verify database ID matches `wrangler.toml`

### R2 Issues
- Verify R2 bucket binding is configured
- Check R2 credentials are correct
- Ensure bucket exists and is accessible
- Verify CORS settings if needed

### Runtime Errors
- Check Cloudflare Pages Functions logs
- Review browser console for client-side errors
- Verify all environment variables are set correctly
- Check for missing bindings

### Next.js Specific Issues
- If pages don't load, verify build output directory
- If API routes fail, check Functions configuration
- If static assets fail, verify asset optimization settings

## Notes

- The migration includes foreign key constraints that SQLite doesn't fully support via ALTER TABLE. The constraints are documented but may need manual setup if required.
- Next.js 16 may require the `@cloudflare/next-on-pages` adapter for full compatibility. Test without it first, then add if needed.
- All admin pages are configured as dynamic routes (`export const dynamic = 'force-dynamic'`) to prevent build-time errors.
- The build output directory may need adjustment based on Next.js 16's actual output structure.

