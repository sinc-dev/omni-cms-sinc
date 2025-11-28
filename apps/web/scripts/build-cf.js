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

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get memory usage
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: formatBytes(usage.rss), // Resident Set Size - total memory allocated
    heapTotal: formatBytes(usage.heapTotal), // Total heap memory
    heapUsed: formatBytes(usage.heapUsed), // Heap memory used
    external: formatBytes(usage.external), // External memory
  };
}

// Helper function to log memory usage (only if BUILD_DEBUG is set)
function logMemoryUsage(label) {
  if (process.env.BUILD_DEBUG === 'true') {
    const mem = getMemoryUsage();
    console.log(`\n📊 Memory Usage [${label}]:`);
    console.log(`   RSS: ${mem.rss} | Heap Total: ${mem.heapTotal} | Heap Used: ${mem.heapUsed} | External: ${mem.external}`);
  }
}

// Ensure we're running from the correct directory (apps/web)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Verify we're in the right location - .next should exist after next build
if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.error('✗ Error: .next directory not found. Make sure Next.js build completed successfully.');
  process.exit(1);
}

// Log initial memory usage
logMemoryUsage('Initial (after Next.js build)');

// Step 1: Create symlinks (for @cloudflare/next-on-pages path resolution)
// When Root Directory is /apps/web, vercel build looks for apps/web/apps/web/
// We create symlinks to prevent path duplication
// IMPORTANT: These symlinks are cleaned up after build to prevent recursive copying issues
try {
  // Check if symlinks already exist and remove them first
  // This prevents issues if the script is run multiple times
  const checkAndRemove = (path) => {
    if (fs.existsSync(path)) {
      const stat = fs.lstatSync(path); // Use lstat to detect symlinks
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(path);
        console.log(`✓ Removed existing symlink: ${path}`);
      } else {
        // If it's not a symlink, it's a real directory - don't remove it
        console.warn(`⚠ ${path} exists but is not a symlink - skipping`);
        return false;
      }
    }
    return true;
  };
  
  // Create 'web' symlink pointing to current directory (for backward compatibility)
  if (checkAndRemove('web')) {
    fs.symlinkSync('.', 'web', 'dir');
    console.log('✓ Created symlink: web -> .');
  }
  
  // Create 'apps' symlink pointing to parent directory
  // This allows apps/web/apps/web to resolve to apps/web
  if (checkAndRemove('apps')) {
    fs.symlinkSync('..', 'apps', 'dir');
    console.log('✓ Created symlink: apps -> ..');
  }
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
  logMemoryUsage('Before source map deletion');
  deleteSourceMaps('.next');
  console.log('✓ Cleaned source maps');
  logMemoryUsage('After source map deletion');
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
  // Note: Using 3584MB (3.5GB) to leave headroom for the system and other processes
  // Cloudflare Pages build environment may have memory constraints
  env.NODE_OPTIONS = cleanedOptions || '--max-old-space-size=3584';
  
  // Also set for the vercel build child process specifically
  // The @cloudflare/next-on-pages tool runs 'pnpm dlx vercel build' which may need explicit env vars
  env.VERCEL_NODE_OPTIONS = env.NODE_OPTIONS;
  
  // Remove any root directory related env vars that might cause path duplication
  delete env.VERCEL_ROOT;
  delete env.ROOT_DIR;
  
  console.log(`   NODE_OPTIONS: ${env.NODE_OPTIONS}`);
  
  // Log memory before vercel build (the memory-intensive step)
  logMemoryUsage('Before @cloudflare/next-on-pages (vercel build)');
  
  // Execute @cloudflare/next-on-pages with explicit environment variables
  // The NODE_OPTIONS is set in env object above, which should propagate to child processes
  // The @cloudflare/next-on-pages tool runs 'pnpm dlx vercel build' internally
  // 
  // CRITICAL: Use shell wrapper to ensure NODE_OPTIONS is explicitly set before npx runs.
  // This is necessary because pnpm dlx creates an isolated environment that doesn't
  // inherit NODE_OPTIONS from parent processes. By setting it in the shell command itself,
  // we ensure it's available to the vercel build process.
  //
  // IMPORTANT: Even with this, the NODE_OPTIONS MUST be set in Cloudflare Pages dashboard
  // Build environment variables for it to reliably reach the pnpm dlx vercel build process.
  // The dashboard configuration is the most reliable way to ensure it's available.
  const isWindows = process.platform === 'win32';
  // Use export to ensure the variable persists through child processes
  const command = isWindows
    ? `set NODE_OPTIONS=${env.NODE_OPTIONS} && set VERCEL_NODE_OPTIONS=${env.NODE_OPTIONS} && npx @cloudflare/next-on-pages@1`
    : `export NODE_OPTIONS="${env.NODE_OPTIONS}" && export VERCEL_NODE_OPTIONS="${env.NODE_OPTIONS}" && npx @cloudflare/next-on-pages@1`;
  
  console.log(`   ⚠️  NOTE: If build still fails with memory errors, you MUST set NODE_OPTIONS in Cloudflare Pages dashboard:`);
  console.log(`      Settings → Environment Variables → Build section → Add NODE_OPTIONS = ${env.NODE_OPTIONS}`);
  
  execSync(command, { 
    shell: true, // Use shell to ensure NODE_OPTIONS is set in the command
    stdio: 'inherit',
    cwd: projectRoot,
    env: env, // Still pass env for other variables
  });
  
  // Log memory after vercel build
  logMemoryUsage('After @cloudflare/next-on-pages (vercel build)');
  
  // Verify build output doesn't have recursive paths
  const outputDir = path.join(projectRoot, '.vercel', 'output', 'static');
  if (fs.existsSync(outputDir)) {
    console.log('✓ Build output verified at:', outputDir);
    // Check for any suspicious recursive paths
    const checkRecursivePaths = (dir, depth = 0, maxDepth = 5) => {
      if (depth > maxDepth) {
        console.warn(`⚠ Deep directory structure detected at depth ${depth} - possible recursion?`);
        return;
      }
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Check for suspicious patterns like apps/web/apps/web
            if (entry.name === 'apps' || entry.name === 'web') {
              const fullPath = path.join(dir, entry.name);
              const stat = fs.lstatSync(fullPath);
              if (stat.isSymbolicLink()) {
                console.warn(`⚠ Symlink found in output: ${fullPath} - this might cause issues`);
              }
            }
            checkRecursivePaths(path.join(dir, entry.name), depth + 1, maxDepth);
          }
        }
      } catch (err) {
        // Ignore permission errors
      }
    };
    checkRecursivePaths(outputDir);
  }
  
  console.log('✓ Cloudflare Pages build complete');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  // Clean up symlinks even on error (CRITICAL to prevent leaving symlinks behind)
  try {
    const removeSymlink = (path) => {
      if (fs.existsSync(path)) {
        const stat = fs.lstatSync(path);
        if (stat.isSymbolicLink()) {
          fs.unlinkSync(path);
          console.log(`✓ Cleaned up symlink: ${path}`);
        }
      }
    };
    removeSymlink('web');
    removeSymlink('apps');
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1);
}

// Step 4: Clean up symlinks (CRITICAL to prevent recursive copying)
// These symlinks are only needed during the build process
// They must be removed afterward to prevent vercel build from following them recursively
try {
  const removeSymlink = (path) => {
    if (fs.existsSync(path)) {
      const stat = fs.lstatSync(path); // Use lstat to detect symlinks
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(path);
        console.log(`✓ Cleaned up symlink: ${path}`);
        return true;
      } else {
        console.warn(`⚠ ${path} exists but is not a symlink - leaving it alone`);
        return false;
      }
    }
    return false;
  };
  
  removeSymlink('web');
  removeSymlink('apps');
} catch (error) {
  console.warn('⚠ Failed to remove symlink:', error.message);
}

console.log('✅ Build complete!');

