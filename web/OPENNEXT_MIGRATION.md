# OpenNext Migration Guide

## Current Status

The project currently uses `@cloudflare/next-on-pages`, which is **deprecated** as of late 2024/early 2025. Cloudflare recommends migrating to the **OpenNext Cloudflare adapter** (`@opennextjs/cloudflare`).

## Why Migrate?

1. **Deprecated Package**: `@cloudflare/next-on-pages` is no longer actively maintained
2. **Better Next.js 16 Support**: OpenNext adapter has better support for Next.js 16 features
3. **Active Development**: OpenNext is actively maintained and recommended by Cloudflare
4. **Future-Proof**: Ensures long-term compatibility and support

## Current Setup

- **Adapter**: `@cloudflare/next-on-pages@1.13.16` (deprecated)
- **Build Script**: `scripts/build.mjs` - handles adapter execution
- **Build Command**: `pnpm build` → runs adapter which runs Next.js build
- **Output**: `.vercel/output/static`

## Migration Steps

### 1. Install OpenNext Cloudflare Adapter

```bash
cd web
pnpm remove @cloudflare/next-on-pages
pnpm add -D @opennextjs/cloudflare
```

### 2. Update Build Script

Replace the current build logic in `scripts/build.mjs` with OpenNext build commands:

```javascript
// New build script for OpenNext
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

process.chdir(projectRoot);

try {
  console.log('Building with OpenNext...');
  
  // Build Next.js app
  execSync('next build', {
    stdio: 'inherit',
    env: { ...process.env, TURBOPACK: '0' },
  });
  
  // Build OpenNext output
  execSync('open-next build', {
    stdio: 'inherit',
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
```

### 3. Update Cloudflare Pages Configuration

**Build Command**: Update to use OpenNext build:
```bash
pnpm build
```

**Build Output Directory**: Change from `.vercel/output/static` to:
```
.open-next
```

### 4. Update Deployment Command (if using manual deployment)

If you're using `wrangler pages deploy` manually:

```bash
# Old (deprecated adapter)
wrangler pages deploy .vercel/output/static

# New (OpenNext)
wrangler pages deploy .open-next
```

### 5. Update Environment Variables

OpenNext may require different environment variable handling. Check the [OpenNext Cloudflare documentation](https://opennext.js.org/cloudflare) for specific requirements.

### 6. Test Locally

```bash
cd web
pnpm build
# Verify .open-next directory is created
```

### 7. Update Documentation

- Update `BUILD_OPTIMIZATION.md` with OpenNext-specific instructions
- Update `DEPLOYMENT.md` with new adapter information
- Remove references to `@cloudflare/next-on-pages`

## Key Differences

### Build Process

**Old (deprecated)**:
1. Run `next build`
2. Run `@cloudflare/next-on-pages` adapter
3. Adapter processes `.next` output
4. Output to `.vercel/output/static`

**New (OpenNext)**:
1. Run `next build`
2. Run `open-next build`
3. OpenNext processes `.next` output
4. Output to `.open-next`

### Configuration

OpenNext uses a different configuration approach. Check the [OpenNext documentation](https://opennext.js.org/cloudflare) for:
- Configuration file requirements
- Environment variable handling
- Cloudflare-specific settings

## Migration Timeline

**Recommended**: Plan migration for next major update or when:
- Current adapter stops working with Next.js updates
- New features require OpenNext-specific functionality
- Maintenance becomes difficult with deprecated package

**Not Urgent**: The current setup will continue to work, but migration should be planned.

## Resources

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [OpenNext GitHub Repository](https://github.com/serverless-stack/open-next)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

## Notes

- The `turbopack.root` configuration in `next.config.ts` will still be needed
- The `TURBOPACK=0` environment variable should still be set
- Build caching and other optimizations remain the same
- The migration primarily affects the adapter package and build output location

