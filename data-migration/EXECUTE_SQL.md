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

After executing the SQL, you'll have these API keys:

- **Study In Kazakhstan**: `omni_099c139e8f5dce0edfc59cc9926d0cd7`
- **Study in North Cyprus**: `omni_b9bda2be53873e496d4b357c5e47446a`
- **Paris American International University**: `omni_5878190cc642fa7c6bedc2f91344103b`

## Step 3: Run Test Import

Use any of the API keys (they all have full permissions `*`):

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="omni_099c139e8f5dce0edfc59cc9926d0cd7"
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
$env:OMNI_CMS_API_KEY="omni_099c139e8f5dce0edfc59cc9926d0cd7"
curl -H "Authorization: Bearer $env:OMNI_CMS_API_KEY" http://localhost:8787/api/admin/v1/organizations
```

Should return JSON with organizations list!

