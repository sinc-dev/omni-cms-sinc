# Local Development Authentication Setup

## Problem

The API requires authentication. For local development, you need an API key.

## Solution: Create an API Key

### Option 1: Via Admin UI (Easiest)

1. **Start the web app** (in a separate terminal):
   ```powershell
   cd apps/web
   pnpm dev
   ```

2. **Access the admin UI**:
   - Open http://localhost:3000 (or whatever port Next.js uses)
   - Log in (you may need to set up Cloudflare Access for local dev, or bypass it)

3. **Create API Key**:
   - Go to Organization Settings → API Keys
   - Create a new API key with all scopes (`*` or individual scopes)
   - Copy the key (starts with `omni_`)

4. **Use the key**:
   ```powershell
   $env:OMNI_CMS_API_KEY="omni_your_key_here"
   $env:OMNI_CMS_BASE_URL="http://localhost:8787"
   env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

### Option 2: Direct Database Access

If you have direct access to the local D1 database:

1. **Find your organization ID**:
   ```bash
   wrangler d1 execute omni-cms --local --command="SELECT id, slug FROM organizations LIMIT 5;"
   ```

2. **Create API key manually** (see `create-test-api-key.js` for SQL)

### Option 3: Bypass Auth for Local Dev (Advanced)

You could modify the middleware to skip auth in local dev mode, but this is not recommended for security reasons.

## Quick Test

Once you have an API key:

```powershell
# Test authentication
$env:OMNI_CMS_API_KEY="omni_your_key_here"
curl -H "Authorization: Bearer $env:OMNI_CMS_API_KEY" http://localhost:8787/api/admin/v1/organizations
```

If you get a JSON response with organizations, authentication is working!

## Troubleshooting

### "No Cloudflare Access token found"
- This is expected - use API key authentication instead
- Set `OMNI_CMS_API_KEY` environment variable

### "Organization not found"
- Make sure organizations exist in your local database
- Check organization slugs match: `study-in-kazakhstan`, etc.

### "Unauthorized"
- Verify API key is correct
- Check API key hasn't expired
- Ensure API key has required scopes

