# Memory Fix Summary - Build Failure Analysis

## Problem
Build fails during `vercel build` step with:
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
Mark-Compact 4016.8 (4140.8) -> 4004.7 (4144.3) MB
```

## Root Cause
The `vercel build` process (inside `@cloudflare/next-on-pages`) is running out of memory despite:
- NODE_OPTIONS set to 4GB
- NEXT_PRIVATE_WORKERS set to reduce parallel processing

## Fixes Applied

### 1. ✅ Fixed Config Warning
- Moved `outputFileTracingExcludes` from `experimental` to root level
- Next.js 16 requires it at root, not under experimental

### 2. ✅ Reduced Workers
- Changed `NEXT_PRIVATE_WORKERS` from 4 to 2
- Lower worker count = lower peak memory usage

### 3. ✅ Fixed Environment Variable Format
- Changed from `NODE_OPTIONS='--max-old-space-size=4096'` (single quotes)
- To `NODE_OPTIONS=--max-old-space-size=4096` (no quotes)
- Some shells don't handle quotes in package.json scripts correctly

## Remaining Issue
The log shows "Collecting page data using 7 workers" which means `NEXT_PRIVATE_WORKERS` isn't being respected. This might be because:
1. The environment variable format in package.json
2. Next.js might be ignoring it in some contexts

## Next Steps if Still Failing

1. **Make more routes dynamic** - Reduce static page generation
2. **Further reduce workers** - Try `NEXT_PRIVATE_WORKERS=1`
3. **Check Cloudflare Pages memory limit** - It might be capped at ~4GB
4. **Contact Cloudflare Support** - Request build environment with more memory
5. **Consider alternative** - Use OpenNext adapter instead of `@cloudflare/next-on-pages`

## Files Modified
- `apps/web/next.config.ts` - Fixed outputFileTracingExcludes location
- `apps/web/package.json` - Reduced workers, fixed env var format
- `apps/web/scripts/build-cf.js` - Improved env var handling


