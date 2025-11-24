# Setup Organizations and API Keys

## Quick Setup

### Option 1: Using Direct JWT Token

If you have a Cloudflare Access JWT token:

```bash
# Set your JWT token
export ADMIN_API_KEY=your-jwt-token-here

# Run the setup script
node scripts/setup-organizations-with-keys.js
```

### Option 2: Using Application Token Credentials

If you have `CF-Access-Client-Id` and `CF-Access-Client-Secret`:

```bash
# Set Application Token credentials
export CF_ACCESS_CLIENT_ID=your-client-id
export CF_ACCESS_CLIENT_SECRET=your-client-secret
export CF_ACCESS_DOMAIN=sincdev.cloudflareaccess.com

# Run the setup script
node scripts/setup-organizations-with-keys.js
```

**On Windows PowerShell:**
```powershell
$env:CF_ACCESS_CLIENT_ID="your-client-id"
$env:CF_ACCESS_CLIENT_SECRET="your-client-secret"
$env:CF_ACCESS_DOMAIN="sincdev.cloudflareaccess.com"
node scripts/setup-organizations-with-keys.js
```

## What It Does

1. **Creates Organizations**
   - Study In Kazakhstan
   - Study in North Cyprus
   - Paris American International University

2. **Creates API Keys** for each organization with scopes:
   - Posts (read, create, update, delete, publish)
   - Media (read, create, update, delete)
   - Taxonomies (read, create, update, delete)
   - Post types and custom fields (read)
   - Organizations (read)

3. **Saves API Keys** to:
   - `api-keys.json` - Full JSON with all details
   - `.env.api-keys` - Environment variable format

## Output Files

### `api-keys.json`
Complete JSON file with all organization and API key details:
```json
{
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "apiUrl": "https://omni-cms-api.joseph-9a2.workers.dev",
  "organizations": [
    {
      "organizationId": "org-123",
      "organizationName": "Study In Kazakhstan",
      "apiKeyId": "key-456",
      "apiKeyName": "Study In Kazakhstan - Content Management API Key",
      "keyPrefix": "omni_abc",
      "key": "omni_abc1234567890...",
      "scopes": ["posts:read", "posts:create", ...]
    }
  ]
}
```

### `.env.api-keys`
Environment variable format for easy use:
```bash
STUDY_IN_KAZAKHSTAN_API_KEY=omni_abc1234567890...
STUDY_IN_NORTH_CYPRUS_API_KEY=omni_def9876543210...
PARIS_AMERICAN_INTERNATIONAL_UNIVERSITY_API_KEY=omni_ghi4567890123...
```

## Authentication Methods

### Method 1: Direct JWT Token
The API expects a JWT token in the `Cf-Access-Jwt-Assertion` header. You can get this:
- From browser DevTools when accessing through Cloudflare Access
- Or generate it from Application Token credentials (Method 2)

### Method 2: Application Token Credentials
If you have `CF-Access-Client-Id` and `CF-Access-Client-Secret`:
- The script will automatically generate a JWT token
- Then use that JWT token for authentication

**Note**: `CF-Access-Client-Id` and `CF-Access-Client-Secret` alone are **not sufficient**. They need to be converted to a JWT token first, which the script does automatically.

## Usage

### Using the API Keys

#### From Node.js/JavaScript:
```javascript
import { readFile } from 'fs/promises';

const keys = JSON.parse(await readFile('api-keys.json', 'utf-8'));
const apiKey = keys.organizations[0].key;

// Use in API requests
const response = await fetch('https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/org-123/posts', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
});
```

#### From Environment Variables:
```bash
source .env.api-keys
# Now $STUDY_IN_KAZAKHSTAN_API_KEY is available
```

## Security Notes

⚠️ **IMPORTANT**:
- API keys are only shown **once** when created
- The `api-keys.json` and `.env.api-keys` files contain sensitive data
- These files are automatically added to `.gitignore`
- **Keep these files secure** and never commit them to git
- If you lose an API key, you'll need to create a new one via the API

## Troubleshooting

### "No authentication method provided"
- Make sure you've set either:
  - `ADMIN_API_KEY` (direct JWT token), OR
  - `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` (Application Token credentials)

### "Failed to generate JWT token"
- Check that your `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are correct
- Verify your `CF_ACCESS_DOMAIN` is correct (default: `sincdev.cloudflareaccess.com`)
- Make sure the Application Token has the right permissions

### "Failed to create organization: 401"
- Your JWT token is invalid or expired
- If using Application Token, the JWT generation may have failed
- Check that your Cloudflare Access is properly configured

### "Failed to create API key: 403"
- Your admin token doesn't have permission to create API keys
- You may need to use a different authentication method

### Organization Already Exists
- The script will detect existing organizations and reuse them
- It will still create a new API key for the organization

## Next Steps

After successful setup:
1. ✅ Organizations are created
2. ✅ API keys are saved to files
3. ⏭️ Use the API keys to import WordPress data
4. ⏭️ Set up post types for each organization
5. ⏭️ Configure taxonomies
