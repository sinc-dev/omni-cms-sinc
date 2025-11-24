# Turbopack Build Fix

## Problem

The build was failing because `@cloudflare/next-on-pages` runs `pnpm run build` internally, and the `TURBOPACK=0` environment variable set in the build script wasn't being inherited by the nested build process. This caused Turbopack to be used instead of webpack, which is incompatible with `@cloudflare/next-on-pages`.

## Solution Implemented

### 1. Build Script (`scripts/build.mjs`)

A Node.js build script has been created that:

1. **Sets `TURBOPACK=0` in the environment** - This ensures all child processes (including the nested build) inherit the variable
2. **Explicitly sets `TURBOPACK=0` in the command** - `TURBOPACK=0 next build` ensures it's available at shell level
3. **Runs `next build`** with the environment variable set
4. **Runs `@cloudflare/next-on-pages` adapter** - Only if not already inside the adapter

The build script is now called from `package.json`:
```json
"build": "TURBOPACK=0 node scripts/build.mjs"
```

### 2. Next.js Configuration (`next.config.ts`)

Added both `outputFileTracingRoot` and `turbopack.root` configuration to fix root detection issues in monorepo setups:

```typescript
const root = path.join(__dirname, ".."); // Monorepo root (where pnpm-lock.yaml lives)

const nextConfig: NextConfig = {
  // Both must point to the SAME root (monorepo root)
  outputFileTracingRoot: root,
  turbopack: {
    root,
  },
  // ... rest of config
};
```

**Critical**: Both `outputFileTracingRoot` and `turbopack.root` **must have the same value**. If they differ, Next.js will ignore `turbopack.root` and use `outputFileTracingRoot`, causing the "workspace root" error.

This fixes the error: "We couldn't find the Next.js package (next/package.json) from the project directory" that occurs when Turbopack infers the wrong workspace root.

## Required: Cloudflare Pages Dashboard Environment Variable

**⚠️ CRITICAL**: You **MUST** set `TURBOPACK=0` as an environment variable in the Cloudflare Pages dashboard. Setting it only in the build script is **not sufficient**.

1. Go to **Cloudflare Dashboard → Pages → omni-cms-sinc → Settings → Environment Variables**
2. Add a new environment variable:
   - **Variable name**: `TURBOPACK`
   - **Value**: `0`
   - **Environment**: Production (and Preview if needed)
3. Save the changes

**Why this is required**: When `@cloudflare/next-on-pages` adapter spawns new processes (like when it calls `pnpm run build`), it doesn't inherit command-level environment variables. The dashboard setting ensures the variable is available to all build processes, including nested ones inside the adapter.

## Why This Is Needed

- Next.js 16.0.3 defaults to using Turbopack when available
- `@cloudflare/next-on-pages` requires webpack (not Turbopack)
- The nested build process inside `@cloudflare/next-on-pages` doesn't inherit inline environment variables
- Setting it in the environment (via script or dashboard) ensures it's available to all processes
- Next.js 16's Turbopack has root detection issues in pnpm monorepo setups
- The `turbopack.root` config ensures proper root detection even if Turbopack is accidentally used

## Deprecated Adapter Notice

**Important**: `@cloudflare/next-on-pages` is deprecated. Cloudflare recommends migrating to the OpenNext adapter (`@opennextjs/cloudflare`). See `OPENNEXT_MIGRATION.md` for migration planning.

## Expected Result

After this fix:
- Build logs should show "Next.js 16.0.3" (without "(Turbopack)")
- The build should use webpack and complete successfully
- The `@cloudflare/next-on-pages` adapter should process the build output correctly

## Verification

To verify the fix is working:

1. Check build logs for "Next.js 16.0.3" (not "Next.js 16.0.3 (Turbopack)")
2. Build should complete without Turbopack-related errors
3. The adapter should successfully process the build output

