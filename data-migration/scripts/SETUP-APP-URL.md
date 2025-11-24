# Setting APP_URL for Workers Route Media URLs

## Issue

The API is generating R2 URLs (like `https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/...`) instead of Workers route URLs because `APP_URL` environment variable is not set.

## Solution

Set the `APP_URL` environment variable in Cloudflare Workers to generate Workers route URLs.

## Steps

### 1. For Local Development (Already Done)

The `APP_URL` has been added to `apps/api/wrangler.toml`:
```toml
APP_URL = "https://omni-cms-api.joseph-9a2.workers.dev"
```

### 2. For Production (Cloudflare Workers)

**Go to**: Cloudflare Dashboard → Workers & Pages → omni-cms-api → Settings → Variables

**Add Environment Variable**:
- **Variable name**: `APP_URL`
- **Value**: `https://omni-cms-api.joseph-9a2.workers.dev`
- **Environment**: Production (and Preview if needed)

### 3. Verify

After setting `APP_URL`, redeploy the Worker and check API responses. The `featuredImage` URLs should now be:
- `https://omni-cms-api.joseph-9a2.workers.dev/api/public/v1/media/{fileKey}`
- Instead of: `https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/{fileKey}`

## What This Fixes

- ✅ Featured image URLs in API responses will use Workers route
- ✅ Media URLs will be served through Workers with proper caching
- ✅ R2 bucket can remain private
- ✅ Better CDN caching via Cloudflare edge

## Note

The SQL file (`fix-r2-urls-execute.sql`) was for replacing R2 URLs in post `content` field. Since the UPDATE found 0 rows, it means:
- Either the content doesn't have R2 URLs (they're only in featuredImage)
- Or the URLs were already replaced

The main fix needed is setting `APP_URL` in production so the API generates Workers URLs going forward.

