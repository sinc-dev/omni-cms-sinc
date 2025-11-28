# Local Build Testing Guide

## Why Test Locally?

Testing the build locally before deploying to Cloudflare Pages helps you:
- Catch build errors early
- Verify memory usage is acceptable
- Check for recursive copying issues
- Ensure the build output is correct
- Save time and build minutes

## Quick Test

Run the local build simulation:

```bash
cd apps/web
pnpm run build:simulate
```

This script:
1. Simulates the Cloudflare Pages build environment
2. Runs the exact same build commands
3. Monitors memory usage
4. Checks for recursive paths and symlink issues
5. Verifies the build output

## Full Build Test

To run the actual build (same as Cloudflare Pages):

```bash
cd apps/web
pnpm run build:cf
```

This runs:
1. `next build` with memory limits
2. `build-cf.js` which:
   - Creates temporary symlinks (for path resolution)
   - Deletes source maps
   - Runs `@cloudflare/next-on-pages`
   - Cleans up symlinks
   - Verifies output

## What to Check

After running the build, verify:

1. **Build Output Exists**: Check that `.vercel/output/static` directory exists
2. **No Recursive Paths**: The build script will warn if it detects suspicious recursive patterns
3. **No Symlinks in Output**: Symlinks should not appear in the build output
4. **Memory Usage**: The build should complete without memory errors
5. **File Count**: Check that expected files are present

## Troubleshooting

### Memory Errors

If you see "JavaScript heap out of memory":
- Increase `NODE_OPTIONS` in `package.json` scripts
- Or set it in your shell: `export NODE_OPTIONS="--max-old-space-size=4096"`

### Recursive Copying Issues

If you see warnings about recursive paths:
- Check that symlinks are being cleaned up properly
- Verify no symlinks exist in `.vercel/output/static`
- Check for circular directory structures

### Build Fails Locally

If the build fails locally:
- Check error messages carefully
- Run with `BUILD_DEBUG=true` for more details: `pnpm run build:debug`
- Verify all dependencies are installed: `pnpm install`
- Check that `.next` directory exists after `next build`

## Before Deploying

✅ **Always run `pnpm run build:simulate` before pushing to main branch**

This ensures:
- The build will work on Cloudflare Pages
- No surprises during deployment
- Faster iteration cycle

## Differences from Cloudflare Pages

Note: Local builds may differ slightly from Cloudflare Pages:
- **Memory limits**: Cloudflare Pages may have different memory constraints
- **Environment variables**: Some variables are only available in Cloudflare dashboard
- **Build time**: Local builds may be faster/slower depending on your machine
- **Windows compatibility**: The `vercel build` step (inside `@cloudflare/next-on-pages`) is known to hang on Windows. The simulation script will skip this step on Windows and only verify the Next.js build succeeds. The full build will work correctly on Cloudflare Pages (which runs on Linux).

However, if the Next.js build works locally, it should work on Cloudflare Pages (assuming environment variables are set correctly).

## Windows Users

If you're on Windows and the build simulation hangs at the `@cloudflare/next-on-pages` step:
- This is expected - `vercel build` hangs on Windows
- The simulation script will automatically skip the vercel build step on Windows
- It will verify that the Next.js build succeeds, which is the critical part
- The full build (including vercel build) will work correctly on Cloudflare Pages (Linux)

**Alternative**: Use WSL (Windows Subsystem for Linux) to run the full build locally:
```bash
wsl
cd /mnt/c/Users/Acer/OneDrive/Documents/Software\ Projects/SINCUNI/omni-cms-sinc/apps/web
pnpm run build:cf
```
