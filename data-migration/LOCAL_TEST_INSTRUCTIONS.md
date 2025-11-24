# Local Testing Instructions

## Current Issue

The API requires authentication. You're seeing:
```
Error: Unauthorized: No Cloudflare Access token found
```

## Solution: Use API Key Authentication

The API supports API key authentication. You need to:

### Step 1: Ensure Organizations Exist

Check if organizations exist in your local database. If not, create them:

**Option A: Via Admin UI** (Recommended)
1. Start web app: `cd apps/web && pnpm dev`
2. Access admin UI and create organizations

**Option B: Via Database**
```bash
cd apps/api
pnpm exec wrangler d1 execute omni-cms --local --command="SELECT id, slug FROM organizations;"
```

If empty, you'll need to create them first.

### Step 2: Create API Keys

**Via Admin UI** (Easiest):
1. In admin UI, go to each organization
2. Organization Settings → API Keys
3. Create new API key with all scopes (`*`)
4. Copy the key (starts with `omni_`)

### Step 3: Run Import with API Key

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:OMNI_CMS_API_KEY="omni_your_api_key_here"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

## Quick Test

Test if authentication works:

```powershell
$env:OMNI_CMS_API_KEY="omni_your_key"
curl -H "Authorization: Bearer $env:OMNI_CMS_API_KEY" http://localhost:8787/api/admin/v1/organizations
```

Should return JSON with organizations list.

## Alternative: Bypass Auth for Local Dev

If you want to skip authentication for local testing, we could modify the middleware, but this is **not recommended** for security reasons.

Would you like me to:
1. Create a script to set up test organizations and API keys automatically?
2. Or modify the middleware to allow dev mode bypass (less secure)?

