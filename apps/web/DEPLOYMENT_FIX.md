# Cloudflare Pages Deployment Fix

## Issue
The deploy command `npx wrangler deploy` is for Cloudflare Workers, not Pages. This causes deployment failures.

## Solution

### Deploy Command for Next.js on Cloudflare Pages

With `@cloudflare/next-on-pages` adapter installed, use this deploy command:

**In Cloudflare Pages dashboard → Settings → Builds & deployments:**

**Deploy Command**:
```
npx wrangler pages deploy .vercel/output/static
```

**Explanation**:
- The `@cloudflare/next-on-pages` adapter processes Next.js build output
- It creates optimized output in `.vercel/output/static` directory
- `wrangler pages deploy` deploys that directory to Cloudflare Pages
- This is the correct command for Next.js apps using the adapter

## Current Configuration

- **Build command**: `pnpm build` ✅
- **Build output directory**: `.next` (auto-detected by Pages)
- **Root directory**: `web` ✅
- **Deploy command**: Should be removed or left empty

## Next Steps

After fixing the deploy command:
1. Configure D1 and R2 bindings in Pages Settings → Functions
2. Set environment variables
3. Apply database migrations
4. Trigger a new deployment

