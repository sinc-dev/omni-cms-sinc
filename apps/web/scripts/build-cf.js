#!/usr/bin/env node
/**
 * Cross-platform build script for Cloudflare Pages
 * Handles symlink creation and source map deletion
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
/* eslint-enable @typescript-eslint/no-require-imports */

// Step 1: Create symlink (for @cloudflare/next-on-pages path resolution)
try {
  if (fs.existsSync('web')) {
    fs.unlinkSync('web');
  }
  fs.symlinkSync('.', 'web', 'dir');
  console.log('✓ Created symlink');
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

// Step 3: Run @cloudflare/next-on-pages
console.log('⚡ Running @cloudflare/next-on-pages...');
try {
  execSync('npx @cloudflare/next-on-pages@1', { stdio: 'inherit' });
  console.log('✓ Cloudflare Pages build complete');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Clean up symlink
try {
  if (fs.existsSync('web')) {
    fs.unlinkSync('web');
    console.log('✓ Cleaned up symlink');
  }
} catch (error) {
  console.warn('⚠ Failed to remove symlink:', error.message);
}

console.log('✅ Build complete!');

