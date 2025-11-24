# Setting R2 Secrets for Cloudflare Workers

## Prerequisites

1. Install Wrangler CLI globally (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

## Set Secrets

Navigate to the API directory and set the secrets:

```bash
cd apps/api

# Set R2 Access Key ID
wrangler secret put R2_ACCESS_KEY_ID
# When prompted, paste: 64d3af705113e6b991eb198778080aa7

# Set R2 Secret Access Key
wrangler secret put R2_SECRET_ACCESS_KEY
# When prompted, paste: 64e1077ead95173a34867a14a2e251a6cd9b824a8ed51d9c9697d45717702bcd
```

## Verify Secrets Are Set

You can verify secrets are set (but not view their values):

```bash
wrangler secret list
```

## Important Notes

- ✅ Secrets set via `wrangler secret put` persist across all deployments
- ✅ They work with Cloudflare's automatic Git deployments
- ✅ They are encrypted and stored securely by Cloudflare
- ✅ They are NOT visible in your repository
- ✅ They apply to the production environment by default

## After Setting Secrets

1. Commit and push your code (secrets are already set, so deployment will work)
2. Cloudflare will automatically deploy from your Git repository
3. The secrets will be available to your Worker during runtime

## Troubleshooting

If secrets don't seem to be working:

1. Verify they're set: `wrangler secret list`
2. Check you're authenticated: `wrangler whoami`
3. Ensure you're in the correct directory (`apps/api`)
4. Check Cloudflare Dashboard → Workers & Pages → omni-cms-api → Settings → Variables and Secrets

