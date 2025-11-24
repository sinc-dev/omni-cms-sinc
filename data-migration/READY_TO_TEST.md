# ✅ Ready to Test Import!

## Database Setup Complete

✅ Migrations applied  
✅ Organizations created  
✅ API keys created  

## Your API Keys

Set these environment variables:
- **Study In Kazakhstan**: `OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN` or `OMNI_CMS_API_KEY`
- **Study in North Cyprus**: `OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS` or `OMNI_CMS_API_KEY`
- **Paris American International University**: `OMNI_CMS_API_KEY_PARIS_AMERICAN` or `OMNI_CMS_API_KEY`

**Note**: API keys are stored securely and should not be committed to git. Use environment variables or a secure secret management system.

## Run Test Import

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="your_api_key_here"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

## What Will Happen

1. ✅ Post Types - Creates post type definitions
2. ✅ Taxonomies - Creates taxonomy definitions  
3. ✅ Taxonomy Terms - Creates terms with hierarchies
4. ✅ Custom Fields - Analyzes and creates field definitions
5. ⚠️ Media - Uploads 40 media files (test mode)
6. ⚠️ Posts - Imports 40 posts per content type (test mode)
7. ✅ Relationships - Creates post-to-post relationships

## After Successful Test

Remove `TEST_MODE` and `TEST_LIMIT` to run full import:

```powershell
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="your_api_key_here"
npm run import
```

## Troubleshooting

If you get authentication errors:
- Make sure API server is running: `cd apps/api && pnpm dev`
- Verify API key is correct
- Check organizations exist: `SELECT * FROM organizations;`

