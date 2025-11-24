# Quick Start - Local Testing

## Current Status

✅ API server is running at `http://localhost:8787`  
❌ Authentication required - need API key

## Solution: Create API Key

You have a few options:

### Option 1: Create via Database (Quickest for Testing)

1. **Find or create an organization**:
   ```bash
   cd apps/api
   wrangler d1 execute omni-cms --local --command="SELECT id, slug, name FROM organizations LIMIT 5;"
   ```

2. **If no organizations exist, create one**:
   ```bash
   wrangler d1 execute omni-cms --local --command="INSERT INTO organizations (id, name, slug, created_at, updated_at) VALUES ('test-org-1', 'Test Organization', 'test-org', datetime('now'), datetime('now'));"
   ```

3. **Create an API key** (you'll need to generate the hash):
   - Generate a key: `omni_` + 32 random hex chars
   - Hash it using the API's hash function
   - Insert into `api_keys` table

### Option 2: Use Admin UI

1. Start web app: `cd apps/web && pnpm dev`
2. Access admin UI
3. Create organization and API key via UI

### Option 3: Temporary Dev Bypass (Not Recommended)

We could modify the middleware to skip auth in local dev, but this is a security risk.

## Recommended: Use Option 1

Let me create a helper script to set this up automatically. For now, the easiest is to:

1. **Check if organizations exist**:
   ```bash
   cd apps/api
   wrangler d1 execute omni-cms --local --command="SELECT * FROM organizations;"
   ```

2. **If empty, you'll need to create organizations first** (via admin UI or seed script)

3. **Then create API keys** for those organizations

Would you like me to create a setup script that creates test organizations and API keys automatically for local development?

