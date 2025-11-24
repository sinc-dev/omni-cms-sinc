# Cloudflare Import Guide

## Prerequisites

Before running the import to Cloudflare, ensure:

1. ✅ **API Workers is deployed** - Your API should be deployed to Cloudflare Workers
2. ✅ **R2 credentials configured** - R2 environment variables set in Workers dashboard
3. ✅ **API keys created** - API keys exist for each organization in Cloudflare database
4. ✅ **Database migrations applied** - All migrations run on production D1 database

## Step 1: Find Your Cloudflare Workers API URL

Your API Workers URL will be one of:
- `https://omni-cms-api.<your-subdomain>.workers.dev` (if deployed as Workers)
- `https://api.<your-custom-domain.com>` (if using custom domain)

**To find it:**
1. Go to Cloudflare Dashboard → Workers & Pages
2. Find your `omni-cms-api` worker
3. Copy the workers.dev URL or your custom domain

## Step 2: Set Environment Variables

Set these environment variables before running the import:

```powershell
# Set Cloudflare API URL (replace with your actual URL)
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.<your-subdomain>.workers.dev"

# Set API keys for each organization (use the keys from your Cloudflare database)
$env:OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN="omni_..."
$env:OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS="omni_..."
$env:OMNI_CMS_API_KEY_PARIS_AMERICAN="omni_..."

# Or use a single API key if all organizations use the same one
$env:OMNI_CMS_API_KEY="omni_..."
```

## Step 3: Test Connection First (Recommended)

Test the connection before running the full import:

```powershell
cd data-migration
node scripts/test-r2-config.js
```

Update the script to use your Cloudflare URL, or set the environment variable first.

## Step 4: Run Full Import

### Option A: Full Import (All Data)

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.<your-subdomain>.workers.dev"
$env:OMNI_CMS_API_KEY="omni_..."  # Or set individual keys
node scripts/import-all.js
```

### Option B: Test Import First (Recommended)

Run a small test import first to verify everything works:

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.<your-subdomain>.workers.dev"
$env:OMNI_CMS_API_KEY="omni_..."
$env:TEST_MODE="true"
$env:TEST_LIMIT="10"
node scripts/import-all.js
```

## Step 5: Monitor the Import

The import will show progress for each step:
1. Getting organization ID
2. Importing post types
3. Importing taxonomies
4. Importing taxonomy terms
5. Importing custom fields
6. Uploading media files
7. Importing posts
8. Importing relationships
9. Updating media references

Watch for:
- ✅ Success messages
- ⚠️ Warnings (non-critical)
- ✗ Errors (investigate if critical)

## Step 6: Verify Import

After import completes, verify:

1. **Check post counts:**
   ```bash
   wrangler d1 execute omni-cms --command="SELECT post_type_id, COUNT(*) FROM posts GROUP BY post_type_id;"
   ```

2. **Check media uploads:**
   - Go to Cloudflare R2 dashboard
   - Check `omni-cms-media` bucket
   - Verify files are uploaded

3. **Check relationships:**
   ```bash
   wrangler d1 execute omni-cms --command="SELECT COUNT(*) FROM post_relationships;"
   ```

## Troubleshooting

### API Connection Issues
- Verify Workers URL is correct
- Check API keys are valid in Cloudflare database
- Ensure Workers is deployed and running

### R2 Upload Failures
- Verify R2 credentials in Workers environment variables
- Check R2 bucket exists and is accessible
- Verify bucket name matches `R2_BUCKET_NAME` env var

### Rate Limiting
- If you hit rate limits, the import will show errors
- Wait a few minutes and retry
- Consider reducing batch sizes in import scripts

### Database Errors
- Ensure all migrations are applied
- Check database has sufficient space
- Verify D1 bindings are configured correctly

## Import Time Estimates

Based on typical data volumes:
- **Post Types**: ~1 minute
- **Taxonomies**: ~1 minute
- **Terms**: ~2-5 minutes
- **Custom Fields**: ~2-3 minutes
- **Media**: ~10-30 minutes per 100 files (depends on file sizes)
- **Posts**: ~5-15 minutes per 100 posts
- **Relationships**: ~1-2 minutes
- **Media Updates**: ~2-5 minutes

**Total estimated time**: 30-60 minutes for a typical import

## Important Notes

1. **Don't interrupt the import** - Let it complete fully
2. **Media uploads are slowest** - Be patient during media import
3. **Mappings are saved** - If import fails, you can resume (duplicates will be skipped)
4. **Test mode first** - Always test with `TEST_MODE=true` before full import

