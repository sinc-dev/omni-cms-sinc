# Troubleshooting Guide

## Common Issues and Solutions

### Authentication Issues

#### Problem: Can't Log In

**Symptoms:**
- Redirected to login but can't authenticate
- "Unauthorized" errors
- Stuck in login loop

**Solutions:**

1. **Check Cloudflare Access Configuration**
   ```bash
   # Verify environment variables are set
   echo $CF_ACCESS_TEAM_DOMAIN
   echo $CF_ACCESS_AUD
   ```

2. **Verify JWT Token**
   - Check browser console for JWT errors
   - Verify token is being sent in requests
   - Check token expiration

3. **Check Access Policies**
   - Verify your email is in allowed policies
   - Check identity provider is configured
   - Verify application is properly set up in Cloudflare Access

4. **Test Locally**
   ```bash
   # Check if authentication works in dev
   pnpm dev
   ```

#### Problem: User Not Auto-Provisioned

**Symptoms:**
- Login successful but user doesn't exist
- "User not found" errors

**Solutions:**

1. **Check User Provisioning Code**
   - Verify `getAuthenticatedUser` is being called
   - Check database connection
   - Verify user creation logic

2. **Check Database**
   ```bash
   # Verify users table exists
   wrangler d1 execute omni-cms --command="SELECT * FROM users LIMIT 1;"
   ```

3. **Check Logs**
   - Review application logs for errors
   - Check for database constraint violations
   - Verify email format

### Database Issues

#### Problem: Database Connection Errors

**Symptoms:**
- "Database not configured" errors
- Query failures
- Timeout errors

**Solutions:**

1. **Verify Wrangler Configuration**
   ```toml
   # Check wrangler.toml has correct binding
   [[d1_databases]]
   binding = "DB"
   database_name = "omni-cms"
   database_id = "your-database-id"
   ```

2. **Check Database Exists**
   ```bash
   wrangler d1 list
   ```

3. **Verify Database ID**
   - Get ID from Cloudflare Dashboard
   - Update `wrangler.toml`
   - Redeploy

4. **Check Migrations Applied**
   ```bash
   wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

#### Problem: Migration Failures

**Symptoms:**
- Migrations won't apply
- Schema errors
- Constraint violations

**Solutions:**

1. **Test Migration Locally First**
   ```bash
   pnpm db:migrate
   ```

2. **Check Migration SQL**
   - Review generated SQL in `drizzle/migrations/`
   - Verify SQL syntax
   - Check for conflicts with existing schema

3. **Backup Before Migration**
   ```bash
   wrangler d1 export omni-cms --output=backup.sql
   ```

4. **Apply Migration Step by Step**
   - Apply one migration at a time
   - Verify each step
   - Check for errors

#### Problem: Slow Queries

**Symptoms:**
- Long load times
- Timeout errors
- Performance issues

**Solutions:**

1. **Check Indexes**
   ```bash
   # List indexes
   wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='index';"
   ```

2. **Review Query Performance**
   - Use `EXPLAIN QUERY PLAN`
   - Check for full table scans
   - Verify indexes are being used

3. **Optimize Queries**
   - Use pagination for large datasets
   - Add composite indexes for common queries
   - Limit result sets

4. **Check Data Size**
   - Large tables may need optimization
   - Consider archiving old data
   - Implement caching

### Storage Issues

#### Problem: Media Upload Fails

**Symptoms:**
- Files won't upload
- "Upload failed" errors
- Timeout during upload

**Solutions:**

1. **Verify R2 Configuration**
   ```bash
   # Check environment variables
   echo $R2_ACCOUNT_ID
   echo $R2_ACCESS_KEY_ID
   echo $R2_SECRET_ACCESS_KEY
   echo $R2_BUCKET_NAME
   ```

2. **Check R2 Bucket Exists**
   ```bash
   wrangler r2 bucket list
   ```

3. **Verify Credentials**
   - Check R2 API token is valid
   - Verify permissions are correct
   - Test credentials manually

4. **Check File Size Limits**
   - Default: 10MB
   - Verify file is under limit
   - Check organization settings

5. **Test R2 Connection**
   ```bash
   # Try uploading via CLI
   wrangler r2 object put omni-cms-media/test.txt --file=test.txt
   ```

#### Problem: Media URLs Not Working

**Symptoms:**
- Images don't load
- 404 errors for media
- Broken links

**Solutions:**

1. **Check R2 Public URL**
   - Verify `R2_PUBLIC_URL` is set correctly
   - Check custom domain configuration
   - Verify CDN is working

2. **Check File Keys**
   - Verify file keys in database
   - Check R2 bucket structure
   - Ensure files exist in bucket

3. **Verify CORS**
   - Check R2 bucket CORS settings
   - Allow your domain
   - Test CORS headers

### API Issues

#### Problem: Public API Not Working

**Symptoms:**
- 404 errors
- "Organization not found"
- Empty responses

**Solutions:**

1. **Check Organization Slug**
   - Verify slug matches database
   - Check slug format (lowercase, hyphens)
   - Ensure organization exists

2. **Verify Endpoint URLs**
   - Check route structure matches
   - Verify `/api/public/:orgSlug/...` format
   - Test with known good slug

3. **Check Content Status**
   - Only "published" posts are returned
   - Verify post status
   - Check `publishedAt` date

4. **Test API Directly**
   ```bash
   curl https://your-domain.com/api/public/your-org/posts
   ```

#### Problem: API Key Not Working

**Symptoms:**
- "Invalid API key" errors
- Rate limit errors
- Unauthorized responses

**Solutions:**

1. **Verify API Key Format**
   - Should start with `omni_`
   - Check for typos
   - Ensure no extra spaces

2. **Check Key in Database**
   ```bash
   # Verify key exists
   wrangler d1 execute omni-cms --command="SELECT key_prefix FROM api_keys;"
   ```

3. **Check Expiration**
   - Verify key hasn't expired
   - Check `expires_at` date
   - Generate new key if expired

4. **Verify Rate Limits**
   - Check rate limit hasn't been exceeded
   - Review `last_used_at` timestamp
   - Increase limit if needed

### Performance Issues

#### Problem: Slow Page Loads

**Symptoms:**
- Long initial load times
- Slow API responses
- Laggy interface

**Solutions:**

1. **Check Database Queries**
   - Review query performance
   - Add missing indexes
   - Optimize complex queries

2. **Enable Caching**
   - Verify cache headers are set
   - Check CDN caching
   - Implement client-side caching

3. **Optimize Bundle Size**
   ```bash
   # Analyze bundle
   pnpm build --analyze
   ```

4. **Check Network**
   - Test from different locations
   - Check Cloudflare status
   - Verify CDN is working

#### Problem: High API Latency

**Solutions:**

1. **Add Caching**
   - Implement response caching
   - Use stale-while-revalidate
   - Cache frequently accessed data

2. **Optimize Queries**
   - Use select statements (not `SELECT *`)
   - Add appropriate indexes
   - Limit result sets

3. **Check Database Size**
   - Large databases may be slower
   - Consider archiving old data
   - Monitor query performance

### Build and Deployment Issues

#### Problem: Build Fails

**Symptoms:**
- Deployment fails
- Build errors in logs
- TypeScript errors

**Solutions:**

1. **Check Dependencies**
   ```bash
   pnpm install
   ```

2. **Verify Node Version**
   - Cloudflare Pages uses Node 18+
   - Check `.nvmrc` or `package.json` engines

3. **Test Build Locally**
   ```bash
   pnpm build
   ```

4. **Check TypeScript Errors**
   ```bash
   pnpm tsc --noEmit
   ```

5. **Review Build Logs**
   - Check specific error messages
   - Verify environment variables
   - Check for missing dependencies

#### Problem: Environment Variables Not Loading

**Solutions:**

1. **Verify in Cloudflare Dashboard**
   - Go to Pages → Settings → Environment Variables
   - Check variables are set correctly
   - Verify variable names match code

2. **Check Variable Names**
   - Public vars must start with `NEXT_PUBLIC_`
   - No typos or extra spaces
   - Case-sensitive

3. **Redeploy After Changes**
   - Variables are injected at build time
   - New deployments required for changes
   - Clear cache if needed

### Permission Issues

#### Problem: "Insufficient Permissions"

**Symptoms:**
- Can't access certain pages
- "Forbidden" errors
- Missing menu items

**Solutions:**

1. **Check User Role**
   - Verify role in database
   - Check role permissions
   - Ensure role is assigned to organization

2. **Verify Permissions**
   ```bash
   # Check user role
   wrangler d1 execute omni-cms --command="SELECT r.name, r.permissions FROM roles r JOIN users_organizations uo ON r.id = uo.role_id WHERE uo.user_id = 'user-id';"
   ```

3. **Check Organization Access**
   - Verify user is in organization
   - Check `users_organizations` table
   - Ensure organization ID matches

4. **Review Permission Checks**
   - Check API route permissions
   - Verify `withAuth` wrapper usage
   - Test with different roles

## Diagnostic Commands

### Check Database Schema

```bash
wrangler d1 execute omni-cms --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### Check User Count

```bash
wrangler d1 execute omni-cms --command="SELECT COUNT(*) FROM users;"
```

### Check Organization Count

```bash
wrangler d1 execute omni-cms --command="SELECT COUNT(*) FROM organizations;"
```

### View Recent Logs

```bash
wrangler pages deployment tail --project-name=omni-cms
```

### Test Database Connection

```bash
wrangler d1 execute omni-cms --command="SELECT 1;"
```

### Check R2 Bucket Contents

```bash
wrangler r2 object list omni-cms-media
```

## Getting Help

If issues persist:

1. **Collect Information**:
   - Error messages
   - Browser console logs
   - Network request details
   - Deployment logs

2. **Check Documentation**:
   - Review relevant docs
   - Check Cloudflare documentation
   - Search for similar issues

3. **Contact Support**:
   - Include error details
   - Provide steps to reproduce
   - Share relevant logs

## Emergency Procedures

### Database Corruption

1. **Stop Application**
2. **Export Current State**
   ```bash
   wrangler d1 export omni-cms --output=corrupted-backup.sql
   ```
3. **Restore from Backup**
   ```bash
   wrangler d1 execute omni-cms --file=last-good-backup.sql
   ```
4. **Verify Data**
5. **Restart Application**

### Security Incident

1. **Revoke All API Keys**
2. **Change R2 Credentials**
3. **Review Access Logs**
4. **Check for Unauthorized Access**
5. **Update Access Policies**
6. **Notify Team**

### Complete Service Failure

1. **Check Cloudflare Status**
2. **Verify Database Connection**
3. **Check Environment Variables**
4. **Review Recent Deployments**
5. **Rollback to Last Working Version**
6. **Investigate Root Cause**

