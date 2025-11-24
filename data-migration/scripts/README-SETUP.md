# Setup Organizations with API Keys

## Quick Start

```bash
# Set your admin API key (Cloudflare Access token or admin API key)
export ADMIN_API_KEY=your-admin-token-here

# Run the setup script
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
# Load from .env.api-keys
source .env.api-keys

# Use in scripts
curl -H "Authorization: Bearer $STUDY_IN_KAZAKHSTAN_API_KEY" \
  https://omni-cms-api.joseph-9a2.workers.dev/api/admin/v1/organizations/org-123/posts
```

## Security Notes

⚠️ **IMPORTANT**:
- API keys are only shown once when created
- The `api-keys.json` and `.env.api-keys` files contain sensitive data
- These files are automatically added to `.gitignore`
- Keep these files secure and never commit them to git
- If you lose an API key, you'll need to create a new one

## Troubleshooting

### Error: "ADMIN_API_KEY environment variable is required"
- Make sure you've set the `ADMIN_API_KEY` environment variable
- Use your Cloudflare Access token or an admin API key

### Error: "Failed to create organization: 401"
- Your `ADMIN_API_KEY` is invalid or expired
- Check that you're using a valid Cloudflare Access token

### Error: "Failed to create API key: 403"
- Your admin key doesn't have permission to create API keys
- You may need to use Cloudflare Access authentication instead

### Organization Already Exists
- The script will detect existing organizations and reuse them
- It will still create a new API key for the organization

## Next Steps

After setup:
1. ✅ Organizations are created
2. ✅ API keys are generated and saved
3. ⏭️ Use the API keys to import WordPress data
4. ⏭️ Set up post types for each organization
5. ⏭️ Configure taxonomies

