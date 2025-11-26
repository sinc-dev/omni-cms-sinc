#!/usr/bin/env node
/**
 * Cross-platform build script for Cloudflare Pages
 * Handles source map deletion and runs @cloudflare/next-on-pages
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
/* eslint-enable @typescript-eslint/no-require-imports */

// Ensure we're running from the correct directory (apps/web)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Verify we're in the right location - .next should exist after next build
if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.error('✗ Error: .next directory not found. Make sure Next.js build completed successfully.');
  process.exit(1);
}

// Step 1: Create symlinks (for @cloudflare/next-on-pages path resolution)
// When Root Directory is /apps/web, vercel build looks for apps/web/apps/web/
// We create symlinks to prevent path duplication
try {
  // Create 'web' symlink pointing to current directory (for backward compatibility)
  if (fs.existsSync('web')) {
    fs.unlinkSync('web');
  }
  fs.symlinkSync('.', 'web', 'dir');
  console.log('✓ Created symlink: web -> .');
  
  // Create 'apps' symlink pointing to parent directory
  // This allows apps/web/apps/web to resolve to apps/web
  if (fs.existsSync('apps')) {
    fs.unlinkSync('apps');
  }
  fs.symlinkSync('..', 'apps', 'dir');
  console.log('✓ Created symlink: apps -> ..');
} catch (error) {
  console.warn('⚠ Symlink creation failed (may already exist):', error.message);
}

// Step 2: Delete source maps
function deleteSourceMaps(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      deleteSourceMaps(filePath);
    } else if (file.endsWith('.map')) {
      fs.unlinkSync(filePath);
      console.log(`✓ Deleted: ${filePath}`);
    }
  });
}

if (fs.existsSync('.next')) {
  deleteSourceMaps('.next');
  console.log('✓ Cleaned source maps');
}

// Step 3: Run @cloudflare/next-on-pages from the project root
console.log('⚡ Running @cloudflare/next-on-pages...');
console.log(`   Working directory: ${projectRoot}`);
try {
  // Ensure we run from the project root directory
  process.chdir(projectRoot);
  
  // Set environment variables to prevent path duplication and increase memory
  // Clear any root directory settings that might confuse vercel build
  const env = {
    ...process.env,
    PWD: projectRoot,
  };
  
  // Set NODE_OPTIONS explicitly for vercel build process
  // This is critical because vercel build (inside @cloudflare/next-on-pages) doesn't inherit
  // NODE_OPTIONS from parent processes. Use value from wrangler.toml if set, otherwise 4GB.
  // Note: If NODE_OPTIONS already exists, use it but clean it up (remove any invalid syntax)
  const existingNodeOptions = process.env.NODE_OPTIONS || '';
  // Clean up any invalid options (like --max_old_space_size with underscores)
  const cleanedOptions = existingNodeOptions
    .split(' ')
    .filter(opt => opt && !opt.includes('max_old_space_size')) // Remove invalid underscore version
    .join(' ');
  
  // Set to cleaned existing value or default to 4GB, ensuring no duplicates
  env.NODE_OPTIONS = cleanedOptions || '--max-old-space-size=4096';
  
  // Remove any root directory related env vars that might cause path duplication
  delete env.VERCEL_ROOT;
  delete env.ROOT_DIR;
  
  console.log(`   NODE_OPTIONS: ${env.NODE_OPTIONS}`);
  
  execSync('npx @cloudflare/next-on-pages@1', { 
    stdio: 'inherit',
    cwd: projectRoot,
    env: env
  });
  console.log('✓ Cloudflare Pages build complete');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  // Clean up symlinks even on error
  try {
    if (fs.existsSync('web')) {
      fs.unlinkSync('web');
      console.log('✓ Cleaned up symlink: web');
    }
    if (fs.existsSync('apps')) {
      fs.unlinkSync('apps');
      console.log('✓ Cleaned up symlink: apps');
    }
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1);
}

// Step 4: Clean up symlinks
try {
  if (fs.existsSync('web')) {
    fs.unlinkSync('web');
    console.log('✓ Cleaned up symlink: web');
  }
  if (fs.existsSync('apps')) {
    fs.unlinkSync('apps');
    console.log('✓ Cleaned up symlink: apps');
  }
} catch (error) {
  console.warn('⚠ Failed to remove symlink:', error.message);
}

console.log('✅ Build complete!');

