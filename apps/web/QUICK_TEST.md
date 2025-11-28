# Quick Local Test Guide

## Run This Now

```bash
cd apps/web
pnpm install
pnpm run build:cf
```

## What Should Happen

1. **Next.js Build** (~30-60 seconds)
   - Creates `.next` directory
   - Compiles your Next.js app

2. **OpenNext Build** (~10-30 seconds)
   - Creates `.open-next` directory
   - Transforms output for Cloudflare

## Success = No Errors + Two Directories Created

Check if it worked:
```bash
# Windows PowerShell
Test-Path .next
Test-Path .open-next

# Or just look for the directories
ls .next
ls .open-next
```

## If It Works ✅

You're ready to deploy! Update Cloudflare Pages:
- Build output: `.open-next`
- Build command: `pnpm install && pnpm run build:cf`

## If It Fails ❌

1. **Package not found**: Run `pnpm install` again
2. **Next.js errors**: Fix those first, then retry
3. **OpenNext errors**: Check `opennext.config.ts` is valid

## Key Difference from Old Build

- ❌ **Old**: Used Vercel CLI → Segfaults possible
- ✅ **New**: Direct transformation → No segfaults, faster
