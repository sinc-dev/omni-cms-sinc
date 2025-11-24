# ✅ Ready to Test Import!

## Database Setup Complete

✅ Migrations applied  
✅ Organizations created  
✅ API keys created  

## Your API Keys

- **Study In Kazakhstan**: `omni_099c139e8f5dce0edfc59cc9926d0cd7`
- **Study in North Cyprus**: `omni_b9bda2be53873e496d4b357c5e47446a`
- **Paris American International University**: `omni_5878190cc642fa7c6bedc2f91344103b`

## Run Test Import

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="omni_099c139e8f5dce0edfc59cc9926d0cd7"
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
$env:OMNI_CMS_API_KEY="omni_099c139e8f5dce0edfc59cc9926d0cd7"
npm run import
```

## Troubleshooting

If you get authentication errors:
- Make sure API server is running: `cd apps/api && pnpm dev`
- Verify API key is correct
- Check organizations exist: `SELECT * FROM organizations;`

