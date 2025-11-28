# OpenNext Adapter Migration Guide

## Overview

This guide helps you migrate from `@cloudflare/next-on-pages` to `@opennextjs/cloudflare` adapter.

**Current Status:**
- ✅ OpenNext officially supports Next.js 15 and 14
- ⚠️ Next.js 16 support is not officially confirmed (may work, but not guaranteed)
- ✅ Actively maintained (unlike `@cloudflare/next-on-pages` which is deprecated)
- ✅ Better Node.js API support
- ✅ No Vercel CLI dependency (avoids segfault issues)

## Migration Steps

### Step 1: Install OpenNext Adapter

```bash
cd apps/web
pnpm add -D @opennextjs/cloudflare
```

### Step 2: Update Build Script

Replace the `build:cf` script in `package.json`:

```json
{
  "scripts": {
    "build:cf": "next build && opennext build"
  }
}
```

### Step 3: Create OpenNext Configuration

Create `opennext.config.ts` in `apps/web/`:

```typescript
import { defineConfig } from '@opennextjs/cloudflare';

export default defineConfig({
  // Cloudflare-specific configuration
  buildCommand: 'next build',
  outputDir: '.opennext',
  
  // Cloudflare bindings
  bindings: {
    DB: 'DB', // D1 database binding
    R2_BUCKET: 'R2_BUCKET', // R2 bucket binding
  },
  
  // Environment variables that should be available at runtime
  env: [
    'R2_BUCKET_NAME',
    'CF_ACCESS_TEAM_DOMAIN',
    'CF_ACCESS_AUD',
    'NEXT_PUBLIC_APP_URL',
  ],
});
```

### Step 4: Update wrangler.toml

The `pages_build_output_dir` should point to OpenNext's output:

```toml
pages_build_output_dir = ".opennext"
```

### Step 5: Update Build Script (build-cf.js)

Replace the `@cloudflare/next-on-pages` command with OpenNext:

```javascript
// Replace this line:
// npx @cloudflare/next-on-pages

// With:
// npx opennext build
```

Or create a new script file `scripts/build-opennext.js`:

```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

try {
  process.chdir(projectRoot);
  
  // Run OpenNext build
  execSync('npx opennext build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=3584',
    },
  });
  
  console.log('✅ OpenNext build complete');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
```

### Step 6: Test Locally

```bash
# Build with OpenNext
pnpm run build:cf

# Verify output directory
ls -la .opennext
```

### Step 7: Update Cloudflare Pages Settings

In Cloudflare Pages dashboard:
- **Build command**: `pnpm install && pnpm run build:cf`
- **Build output directory**: `.opennext` (instead of `.vercel/output/static`)

## If Next.js 16 Doesn't Work

If you encounter issues with Next.js 16, you have two options:

### Option A: Downgrade to Next.js 15

```bash
pnpm add next@15 react@18 react-dom@18
```

Then update your code for any Next.js 16-specific features you're using.

### Option B: Wait for Official Support

Monitor the OpenNext repository for Next.js 16 support:
- GitHub: https://github.com/serverless-stack/open-next
- Documentation: https://opennext.js.org/cloudflare

## Differences from next-on-pages

1. **Output Directory**: `.opennext` instead of `.vercel/output/static`
2. **No Vercel CLI**: OpenNext doesn't use Vercel CLI, avoiding segfault issues
3. **Better Node.js Support**: More Node.js APIs are supported
4. **Configuration**: Uses `opennext.config.ts` instead of relying on Vercel build output

## Troubleshooting

### Build Fails with Next.js 16

If you see compatibility errors, try:
1. Check OpenNext GitHub issues for Next.js 16 compatibility
2. Temporarily downgrade to Next.js 15 to verify the setup works
3. Report issues to OpenNext repository

### Missing Bindings

Ensure all Cloudflare bindings are configured in:
- `wrangler.toml` (for local development)
- Cloudflare Pages dashboard (for production)

### Memory Issues

Set `NODE_OPTIONS` in Cloudflare Pages dashboard:
- Build environment variable: `NODE_OPTIONS=--max-old-space-size=4096`

## Resources

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [OpenNext GitHub Repository](https://github.com/serverless-stack/open-next)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
