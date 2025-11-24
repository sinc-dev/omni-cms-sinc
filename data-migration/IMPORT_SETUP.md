# Import Setup Guide

## What is `OMNI_CMS_BASE_URL`?

`OMNI_CMS_BASE_URL` is the base URL where your Omni-CMS API is running. The import scripts need this to know where to send API requests.

## Your Workers URL

Your Cloudflare Workers URL is:
```
https://omni-cms-api.joseph-9a2.workers.dev
```

## Quick Start

### Test Import (Recommended First)

Test with a small number of records first (40 records per content type):

```bash
# Set your Workers URL
export OMNI_CMS_BASE_URL=https://omni-cms-api.joseph-9a2.workers.dev

# Run test import (40 records per content type)
npm run import:test
```

Or manually:
```bash
export OMNI_CMS_BASE_URL=https://omni-cms-api.joseph-9a2.workers.dev
export TEST_MODE=true
export TEST_LIMIT=40
npm run import
```

### Full Import

Once testing is successful, run the full import:

```bash
export OMNI_CMS_BASE_URL=https://omni-cms-api.joseph-9a2.workers.dev
npm run import
```

## Local Development (Alternative)

If you want to test locally first:

```bash
# Terminal 1: Start API locally
cd apps/api
pnpm dev

# Terminal 2: Run import
cd data-migration
export OMNI_CMS_BASE_URL=http://localhost:8787
npm run import:test  # Test with 40 records
```

## Test Mode

Test mode limits the number of records imported:
- **Posts**: Limited to TEST_LIMIT per content type (default: 40)
- **Media**: Limited to TEST_LIMIT files (default: 40)
- **Other items**: Imported normally (post types, taxonomies, etc.)

This allows you to:
1. Verify the import process works
2. Check data quality
3. Test API authentication
4. Identify issues before full import

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OMNI_CMS_BASE_URL` | `http://localhost:8787` | Base URL of Omni-CMS API |
| `TEST_MODE` | `false` | Enable test mode (limits records) |
| `TEST_LIMIT` | `40` | Number of records per content type in test mode |

## Verify Your URL

Test if your URL is correct:

```bash
curl https://omni-cms-api.joseph-9a2.workers.dev/api/admin/organizations
```

If you get a response (even 401/403), the URL is correct!

## Import Order

1. Post Types
2. Taxonomies  
3. Taxonomy Terms
4. Custom Fields
5. Media Files (limited in test mode)
6. Posts (limited in test mode)
7. Relationships

## Troubleshooting

### Authentication Errors
- Make sure you're authenticated via Cloudflare Access
- Check if your IP/email is allowed in Access policies

### Rate Limiting
- Test mode helps avoid rate limits
- Full import uses batching to minimize rate limit issues

### Missing Data
- Check import logs for skipped items
- Verify mappings are created correctly
- Check API responses for errors

## Next Steps After Test Import

1. ✅ Verify post types created correctly
2. ✅ Check taxonomies and terms imported
3. ✅ Verify custom fields created
4. ✅ Check media uploads work
5. ✅ Verify posts imported with correct data
6. ✅ Check relationships created

If everything looks good, run the full import!
