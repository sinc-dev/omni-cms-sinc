# Fix for pnpm-lock.yaml Out of Sync Error

## Problem

The build is failing because `pnpm-lock.yaml` is out of sync with `package.json`. The lockfile still has the old `@cloudflare/next-on-pages` package, but `package.json` has been updated to use `@opennextjs/cloudflare`.

## Immediate Fix (Cloudflare Pages Dashboard)

Update your build command in Cloudflare Pages dashboard:

**Current:**
```
pnpm install && pnpm run build:cf
```

**Change to:**
```
pnpm install --no-frozen-lockfile && pnpm run build:cf
```

This allows pnpm to update the lockfile during CI builds.

## Permanent Fix (Recommended)

Update the lockfile locally and commit it:

```bash
cd apps/web
pnpm install
git add pnpm-lock.yaml
git commit -m "Update pnpm-lock.yaml for OpenNext migration"
git push
```

After committing the updated lockfile, you can revert the build command back to:
```
pnpm install && pnpm run build:cf
```

## Why This Happened

When we migrated from `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`, we updated `package.json` but didn't update the lockfile. The lockfile needs to be regenerated to reflect the new dependencies.

## Steps to Fix

### Option 1: Quick Fix (Update Build Command)

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings
2. Find **Build command**
3. Change to: `pnpm install --no-frozen-lockfile && pnpm run build:cf`
4. Save and redeploy

### Option 2: Proper Fix (Update Lockfile)

1. Locally, run: `cd apps/web && pnpm install`
2. Commit the updated `pnpm-lock.yaml`
3. Push to repository
4. Cloudflare Pages will automatically use the updated lockfile

Option 2 is recommended for production as it ensures consistent builds.
