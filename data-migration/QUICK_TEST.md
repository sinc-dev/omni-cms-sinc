# Quick Test Import Guide

## Your Workers URL
```
https://omni-cms-api.joseph-9a2.workers.dev
```

## Run Test Import (40 records)

### Step 1: Get Your API Key
1. Log into Omni-CMS admin
2. Go to Organization Settings → API Keys
3. Create a new API key with admin scopes
4. Copy the key (starts with `omni_`)

### Step 2: Run Test Import

#### Windows PowerShell:
```powershell
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.joseph-9a2.workers.dev"
$env:OMNI_CMS_API_KEY="omni_your_api_key_here"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

### Windows CMD:
```cmd
set OMNI_CMS_BASE_URL=https://omni-cms-api.joseph-9a2.workers.dev
set TEST_MODE=true
set TEST_LIMIT=40
npm run import
```

### Linux/Mac:
```bash
export OMNI_CMS_BASE_URL=https://omni-cms-api.joseph-9a2.workers.dev
export TEST_MODE=true
export TEST_LIMIT=40
npm run import
```

## What Test Mode Does

- ✅ **Post Types**: Imported normally (all)
- ✅ **Taxonomies**: Imported normally (all)
- ✅ **Taxonomy Terms**: Imported normally (all)
- ✅ **Custom Fields**: Imported normally (all)
- ⚠️ **Media**: Limited to 40 files
- ⚠️ **Posts**: Limited to 40 per content type (blogs, programs, universities, etc.)
- ✅ **Relationships**: Created for imported posts

## Expected Output

You should see:
```
============================================================
Omni-CMS Data Import
============================================================
Base URL: https://omni-cms-api.joseph-9a2.workers.dev
⚠️  TEST MODE: Limiting to 40 records per content type

============================================================
Importing: study-in-kazakhstan
============================================================

1. Getting organization ID...
   ✓ Organization ID: <uuid>

2. Importing post types...
   ✓ Imported 7 post types

3. Importing taxonomies...
   ✓ Imported X taxonomies

4. Importing taxonomy terms...
   ✓ Imported taxonomy terms

5. Importing custom fields...
   ✓ Imported X custom fields

6. Uploading media files...
   ⚠ TEST MODE: Limiting media from 1051 to 40 files
   ✓ Uploaded 40 media files

7. Importing posts...
   ⚠ TEST MODE: Limiting blogs from 21 to 21 records
   ⚠ TEST MODE: Limiting programs from 5102 to 40 records
   ✓ Imported posts

8. Importing relationships...
   ✓ Created X relationships
```

## After Successful Test

If the test import works correctly, run the full import:

```powershell
# Windows PowerShell
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.joseph-9a2.workers.dev"
npm run import
```

## Troubleshooting

### Authentication Error
- Make sure you're authenticated via Cloudflare Access
- Check your browser is logged into Cloudflare

### Organization Not Found
- Verify organization slugs match: `study-in-kazakhstan`, `study-in-north-cyprus`, `paris-american-international-university`
- Check organizations exist in your Omni-CMS

### Rate Limiting
- Test mode helps avoid this
- If you hit limits, increase delays in scripts

