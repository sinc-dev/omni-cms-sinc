# Test Import on Local Server

## Step 1: Start Local API Server

Open a terminal and run:

```powershell
cd apps/api
pnpm dev
```

This will start the API server at `http://localhost:8787`

Wait until you see:
```
Ready on http://localhost:8787
```

## Step 2: Run Test Import

In **another terminal**, run:

```powershell
cd data-migration
$env:OMNI_CMS_BASE_URL="http://localhost:8787"
$env:TEST_MODE="true"
$env:TEST_LIMIT="40"
npm run import
```

## Note About Authentication

If your local API requires authentication:
- You may need to set `OMNI_CMS_API_KEY` environment variable
- Or configure Cloudflare Access for local development
- Check `apps/api/.dev.vars` or environment configuration

## Quick Test

Test if local API is running:

```powershell
curl http://localhost:8787/health
```

Should return: `{"status":"ok","service":"omni-cms-api"}`

