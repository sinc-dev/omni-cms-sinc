# API Authentication Setup

## Authentication Required

The Omni-CMS API requires authentication. You have two options:

### Option 1: API Key Authentication (Recommended for Scripts)

1. **Create an API Key** in Omni-CMS admin:
   - Go to Organization Settings → API Keys
   - Create a new API key with admin scopes
   - Copy the full key (starts with `omni_`)

2. **Set the API Key** as an environment variable:

```powershell
# Windows PowerShell
$env:OMNI_CMS_API_KEY="omni_your_api_key_here"
```

```bash
# Linux/Mac
export OMNI_CMS_API_KEY="omni_your_api_key_here"
```

3. **Run the import**:

```powershell
$env:OMNI_CMS_BASE_URL="https://omni-cms-api.joseph-9a2.workers.dev"
$env:OMNI_CMS_API_KEY="omni_your_api_key_here"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

### Option 2: Cloudflare Access (For Browser-based Access)

If you're accessing via browser, Cloudflare Access handles authentication automatically. But for scripts, API keys are easier.

## Getting Your API Key

1. Log into Omni-CMS admin panel
2. Navigate to your organization settings
3. Go to "API Keys" section
4. Create a new API key with these scopes:
   - `organizations:read`
   - `post-types:create`
   - `taxonomies:create`
   - `custom-fields:create`
   - `media:create`
   - `posts:create`
   - `relationships:create`

5. Copy the full key (it will look like: `omni_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## Testing Authentication

Test if your API key works:

```powershell
$env:OMNI_CMS_API_KEY="omni_your_api_key_here"
curl -H "Authorization: Bearer $env:OMNI_CMS_API_KEY" https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations
```

If you get a JSON response with organizations, authentication is working!

## Security Note

- Never commit API keys to git
- Store API keys in environment variables
- Use different keys for different environments
- Rotate keys regularly

