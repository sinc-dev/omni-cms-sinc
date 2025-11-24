# Cloudflare Access Authentication Guide

## Authentication Methods

Your Omni-CMS API supports **two authentication methods**:

### Method 1: Cloudflare Access JWT Token (Direct)
**Header**: `Cf-Access-Jwt-Assertion`

This is the JWT token that Cloudflare Access generates automatically when accessing through Cloudflare Access.

**How to get it:**
- Access your application through Cloudflare Access in a browser
- Open DevTools → Network → Find a request → Headers
- Copy the `Cf-Access-Jwt-Assertion` header value

**Usage:**
```bash
export ADMIN_API_KEY=your-jwt-token-here
node scripts/setup-organizations-with-keys.js
```

### Method 2: Application Token Credentials ✅ **RECOMMENDED**
**Headers**: 
- `CF-Access-Client-Id`
- `CF-Access-Client-Secret`

**These are sufficient!** Cloudflare Access validates them at the edge before your Worker receives the request.

**How it works:**
1. You send `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers
2. Cloudflare Access validates them at the edge
3. If valid, Cloudflare Access adds a `Cf-Access-Jwt-Assertion` header with a JWT
4. Your Worker code reads that JWT token

**Usage:**
```bash
export CF_ACCESS_CLIENT_ID=your-client-id
export CF_ACCESS_CLIENT_SECRET=your-client-secret
node scripts/setup-organizations-with-keys.js
```

**On Windows PowerShell:**
```powershell
$env:CF_ACCESS_CLIENT_ID="your-client-id"
$env:CF_ACCESS_CLIENT_SECRET="your-client-secret"
node scripts/setup-organizations-with-keys.js
```

## Answer: Yes, CF-Access-Client-Id and CF-Access-Client-Secret are Sufficient!

✅ **Yes!** `CF-Access-Client-Id` and `CF-Access-Client-Secret` are sufficient for authentication.

The setup script will:
1. Use these credentials in the request headers
2. Cloudflare Access validates them automatically at the edge
3. Your Worker receives the request with a valid JWT token

**No need to generate a JWT token manually** - Cloudflare Access handles it!

## Creating Application Tokens in Cloudflare

1. Go to **Cloudflare Dashboard** → **Zero Trust** → **Access** → **Service Tokens**
2. Click **Create Service Token**
3. Give it a name (e.g., "Omni-CMS Migration")
4. Copy the **Client ID** and **Client Secret** (secret is only shown once!)
5. Add the service token to your Access application policies

## Environment Variables

### Option 1: Direct JWT Token
```bash
export ADMIN_API_KEY=your-jwt-token-here
```

### Option 2: Application Token Credentials ✅ **RECOMMENDED**
```bash
export CF_ACCESS_CLIENT_ID=your-client-id
export CF_ACCESS_CLIENT_SECRET=your-client-secret
# CF_ACCESS_DOMAIN is optional (defaults to sincdev.cloudflareaccess.com)
```

## Important Notes

⚠️ **Security**:
- Application Token secrets are **only shown once** when created
- Store them securely (use environment variables, not in code)
- If lost, you'll need to create a new service token

✅ **Advantages of Application Tokens**:
- No need to manually extract JWT tokens
- Works for automated scripts and CI/CD
- Can be rotated independently
- Better for service-to-service authentication

## Troubleshooting

### "No authentication method provided"
Make sure you've set either:
- `ADMIN_API_KEY` (direct JWT), OR
- `CF_ACCESS_CLIENT_ID` + `CF_ACCESS_CLIENT_SECRET` (Application Token)

### "Failed to create organization: 401"
- Check that your Application Token is added to the Access application policy
- Verify the Client ID and Secret are correct
- Make sure the service token hasn't been revoked

### "Failed to create API key: 403"
- Your Application Token may not have the right permissions
- Check the Access application policies
