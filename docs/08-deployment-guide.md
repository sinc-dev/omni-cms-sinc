# Deployment Guide

## Overview

This guide covers deploying Omni-CMS to Cloudflare Pages with Cloudflare D1 database, R2 storage, and Cloudflare Access authentication.

## Prerequisites

1. **Cloudflare Account** with Pages, D1, R2, and Access enabled
2. **Wrangler CLI** installed globally: `npm install -g wrangler`
3. **Node.js** 18+ and **pnpm** installed
4. **Git** repository set up

## Production Setup

### Step 1: Create Cloudflare Resources

#### 1.1 Create D1 Database

```bash
cd web
wrangler d1 create omni-cms
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "omni-cms"
database_id = "your-database-id-here"
```

#### 1.2 Create R2 Bucket

```bash
wrangler r2 bucket create omni-cms-media
```

Note the bucket name for environment variables.

#### 1.3 Create R2 API Token

1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create a new token with read/write permissions
3. Save the Access Key ID and Secret Access Key

#### 1.4 Configure Cloudflare Access

1. Go to Cloudflare Dashboard → Access → Applications
2. Create a new application for your domain
3. Configure identity providers (Google, GitHub, Email OTP, etc.)
4. Set access policies
5. Note your Team Domain and Application Audience (AUD)

### Step 2: Run Database Migrations

Generate and apply migrations:

```bash
cd web

# Generate migrations from schema
pnpm db:generate

# Apply migrations to production database
pnpm db:migrate:prod
```

### Step 3: Seed Default Data

Seed default roles and initial data:

```bash
# Generate seed SQL
pnpm db:seed

# Apply seed SQL to production
wrangler d1 execute omni-cms --command="<paste generated SQL>"
```

**Default Roles:**
- `super_admin` - Full system access
- `org_admin` - Full access within organization(s)
- `editor` - Create, edit, and publish content
- `author` - Create and edit own content
- `viewer` - Read-only access

### Step 4: Configure Environment Variables

Set the following environment variables in Cloudflare Pages:

#### Required Variables

```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# D1 Database (automatically available via binding)
# No explicit variable needed if using wrangler.toml

# R2 Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=omni-cms-media
R2_PUBLIC_URL=https://media.yourdomain.com  # Optional: if using custom domain

# Cloudflare Access
CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CF_ACCESS_AUD=your-access-aud

# Next.js
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

#### Optional Variables

```bash
# Cache Settings
CACHE_TTL=3600

# Rate Limiting
DEFAULT_RATE_LIMIT=10000
```

### Step 5: Deploy to Cloudflare Pages

#### 5.1 Using Wrangler (Recommended)

```bash
cd web

# Build the application
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy .next --project-name=omni-cms
```

#### 5.2 Using Git Integration

1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect your Git repository
3. Configure build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `.next`
   - **Root directory**: `web` (if repository root is parent directory)
   - **Node version**: `18` or `20`
4. Set environment variables in Pages settings
5. Deploy

#### 5.3 Build Configuration

Create `cloudflare.json` in project root:

```json
{
  "pages_build_output_dir": ".next",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"]
}
```

### Step 6: Post-Deployment

#### 6.1 Verify Database Connection

```bash
wrangler d1 execute omni-cms --command="SELECT COUNT(*) FROM organizations;"
```

#### 6.2 Verify R2 Access

Test media upload functionality in the admin panel.

#### 6.3 Verify Authentication

1. Access the admin panel URL
2. You should be redirected to Cloudflare Access login
3. Complete authentication
4. Verify user is auto-provisioned

#### 6.4 Create First Organization

1. Log in as super admin
2. Go to Organizations → Create
3. Create your first organization
4. Set up initial users and roles

## Environment-Specific Configuration

### Development

Use `.env.local` file (not committed to Git):

```bash
cp env.example .env.local
# Edit .env.local with your values
```

### Staging

Create a staging Cloudflare Pages project with separate:
- D1 database
- R2 bucket
- Access application

Use same deployment process with staging-specific environment variables.

### Production

- Use production D1 database
- Use production R2 bucket with CDN
- Use production Access application
- Enable cache invalidation
- Monitor performance and errors

## Database Management

### Backup Strategy

```bash
# Export database
wrangler d1 export omni-cms --output=backup.sql

# Import database
wrangler d1 execute omni-cms --file=backup.sql
```

**Recommended Backup Schedule:**
- Daily automated backups (via Cloudflare scheduled workers)
- Manual backups before major migrations
- Keep backups for 30 days

### Migration Process

1. **Test migrations locally**:
   ```bash
   pnpm db:migrate
   ```

2. **Generate migration**:
   ```bash
   pnpm db:generate
   ```

3. **Review migration SQL** in `drizzle/migrations/`

4. **Apply to production**:
   ```bash
   pnpm db:migrate:prod
   ```

5. **Verify migration**:
   ```bash
   wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

## Monitoring & Maintenance

### Error Tracking

Set up error tracking (e.g., Sentry):

1. Create Sentry project
2. Add DSN to environment variables
3. Configure error boundaries in React components

### Performance Monitoring

Monitor:
- API response times
- Database query performance
- R2 upload/download speeds
- Page load times

Use Cloudflare Analytics and Workers Analytics.

### Logs

Access logs via:
```bash
wrangler pages deployment tail --project-name=omni-cms
```

## Scaling Considerations

### Database Scaling

- D1 has limits on query complexity and size
- Use pagination for large datasets
- Optimize queries with indexes
- Consider read replicas for high traffic

### Storage Scaling

- R2 is infinitely scalable
- Use CDN for media delivery
- Implement cache headers
- Optimize image sizes

### API Scaling

- Cloudflare Pages automatically scales
- Use rate limiting for public APIs
- Implement caching strategies
- Monitor API key usage

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: "Database not configured"

**Solution**:
- Verify `wrangler.toml` has correct database binding
- Check D1 database ID is correct
- Ensure database exists in your Cloudflare account

#### 2. Authentication Not Working

**Problem**: Users can't log in

**Solution**:
- Verify `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD` are correct
- Check Cloudflare Access application configuration
- Verify JWT validation is working
- Check user email matches Access policies

#### 3. Media Upload Failures

**Problem**: Files won't upload

**Solution**:
- Verify R2 credentials are correct
- Check bucket name matches `R2_BUCKET_NAME`
- Verify R2 bucket exists and has proper permissions
- Check file size limits (10MB default)

#### 4. Environment Variables Not Loading

**Problem**: Variables undefined at runtime

**Solution**:
- Variables must be set in Cloudflare Pages dashboard
- Public variables must be prefixed with `NEXT_PUBLIC_`
- Restart deployment after adding variables
- Verify variables in Pages → Settings → Environment Variables

#### 5. Build Failures

**Problem**: Build fails on Cloudflare Pages

**Solution**:
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Check build logs for specific errors
- Test build locally with `pnpm build`

## Security Checklist

- [ ] Environment variables are set (never commit secrets)
- [ ] R2 bucket has proper access controls
- [ ] Cloudflare Access is configured and tested
- [ ] API keys are hashed in database
- [ ] Rate limiting is enabled
- [ ] CORS is configured correctly
- [ ] HTTPS is enforced
- [ ] Database backups are automated
- [ ] Error messages don't expose sensitive information
- [ ] Input validation is implemented

## Rollback Procedure

If deployment fails:

1. **Revert to previous deployment**:
   ```bash
   wrangler pages deployment rollback <deployment-id> --project-name=omni-cms
   ```

2. **Revert database migration** (if needed):
   - Restore from backup
   - Or manually reverse migration SQL

3. **Verify previous version works**:
   - Test critical functionality
   - Check logs for errors

## Support Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Access Docs](https://developers.cloudflare.com/cloudflare-one/policies/access/)

## Next Steps

After deployment:
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure automated backups
4. Document custom configurations
5. Train team on deployment process

