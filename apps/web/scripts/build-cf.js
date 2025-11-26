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
const currentDir = process.cwd();
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Verify we're in the right location - .next should exist after next build
if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.error('✗ Error: .next directory not found. Make sure Next.js build completed successfully.');
  process.exit(1);
}

// Step 1: Delete source maps
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

// Step 2: Run @cloudflare/next-on-pages from the project root
console.log('⚡ Running @cloudflare/next-on-pages...');
console.log(`   Working directory: ${projectRoot}`);
try {
  // Ensure we run from the project root directory
  process.chdir(projectRoot);
  execSync('npx @cloudflare/next-on-pages@1', { 
    stdio: 'inherit',
    cwd: projectRoot,
    env: {
      ...process.env,
      // Explicitly set working directory environment variable
      PWD: projectRoot,
    }
  });
  console.log('✓ Cloudflare Pages build complete');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}

console.log('✅ Build complete!');

