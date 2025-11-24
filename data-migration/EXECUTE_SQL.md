# Execute SQL to Setup Local Database

## Step 1: Execute SQL in Local Database

Run this command to execute the SQL file:

```powershell
cd apps/api
pnpm exec wrangler d1 execute omni-cms --local --file=../../data-migration/setup-local-db.sql
```

Or copy-paste the SQL directly:

```powershell
cd apps/api
pnpm exec wrangler d1 execute omni-cms --local --command="$(Get-Content ../../data-migration/setup-local-db.sql -Raw)"
```

## Step 2: Use the API Keys

After executing the SQL, API keys will be created in the database. 

**Note**: Full API keys are only shown once when created via the API. For local testing, you can:
1. Create new API keys via the admin API
2. Use the key prefixes shown in the database (e.g., `099c139e` for Study In Kazakhstan)
3. Set environment variables: `OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN`, `OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS`, or `OMNI_CMS_API_KEY_PARIS_AMERICAN`

## Step 3: Run Test Import

Use any of the API keys (they all have full permissions `*`):

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="your_api_key_here"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

## Verify Setup

Check if organizations were created:

```powershell
cd apps/api
pnpm exec wrangler d1 execute omni-cms --local --command="SELECT id, name, slug FROM organizations;"
```

Check if API keys were created:

```powershell
pnpm exec wrangler d1 execute omni-cms --local --command="SELECT id, name, key_prefix, organization_id FROM api_keys;"
```

## Test Authentication

Test if API key works:

```powershell
$env:OMNI_CMS_API_KEY="your_api_key_here"
curl -H "Authorization: Bearer $env:OMNI_CMS_API_KEY" http://localhost:8787/api/admin/v1/organizations
```

Should return JSON with organizations list!

