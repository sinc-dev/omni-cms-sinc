#!/usr/bin/env node
/**
 * Local Cloudflare Pages Build Simulation
 * 
 * This script simulates the Cloudflare Pages build environment locally
 * to catch build errors before deploying. It:
 * - Sets up the same working directory structure
 * - Reads environment variables from wrangler.toml
 * - Runs the exact same commands in the same order
 * - Monitors memory usage during build
 * - Provides clear error messages
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

// Helper function to log memory usage
function logMemoryUsage(label) {
  const mem = getMemoryUsage();
  console.log(`\n📊 Memory Usage [${label}]:`);
  console.log(`   RSS: ${mem.rss} | Heap Total: ${mem.heapTotal} | Heap Used: ${mem.heapUsed} | External: ${mem.external}`);
}

// Parse wrangler.toml to extract environment variables
function parseWranglerToml(wranglerPath) {
  const content = fs.readFileSync(wranglerPath, 'utf-8');
  const vars = {};
  
  // Extract [vars] section
  const varsMatch = content.match(/\[vars\]\s*\n((?:[^[\n]+\n?)+)/);
  if (varsMatch) {
    const varsContent = varsMatch[1];
    // Parse key = value pairs
    varsContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*["']?([^"'\n]+)["']?\s*$/);
      if (match) {
        vars[match[1]] = match[2];
      }
    });
  }
  
  return vars;
}

// Main simulation function
function simulateCloudflareBuild() {
  console.log('🚀 Cloudflare Pages Build Simulation');
  console.log('=====================================\n');
  
  // Step 1: Determine paths
  const scriptDir = __dirname; // apps/web/scripts
  const projectRoot = path.resolve(scriptDir, '..'); // apps/web
  // Monorepo root is two levels up from apps/web (apps/web -> apps -> repo root)
  const repoRoot = path.resolve(projectRoot, '..', '..');
  
  console.log(`📁 Project Root: ${projectRoot}`);
  console.log(`📁 Repo Root: ${repoRoot}\n`);
  
  // Step 2: Read wrangler.toml
  const wranglerPath = path.join(projectRoot, 'wrangler.toml');
  if (!fs.existsSync(wranglerPath)) {
    console.error(`✗ Error: wrangler.toml not found at ${wranglerPath}`);
    process.exit(1);
  }
  
  console.log('📖 Reading wrangler.toml...');
  const wranglerVars = parseWranglerToml(wranglerPath);
  console.log(`   Found ${Object.keys(wranglerVars).length} environment variables\n`);
  
  // Step 3: Set up environment variables
  const env = {
    ...process.env,
    // Add variables from wrangler.toml
    ...wranglerVars,
    // Cloudflare Pages specific settings
    PWD: projectRoot,
    // Ensure NODE_OPTIONS is set (required for memory management)
    NODE_OPTIONS: wranglerVars.NODE_OPTIONS || process.env.NODE_OPTIONS || '--max-old-space-size=4096',
  };
  
  // Remove any conflicting env vars
  delete env.VERCEL_ROOT;
  delete env.ROOT_DIR;
  
  console.log('🔧 Environment Variables:');
  console.log(`   NODE_OPTIONS: ${env.NODE_OPTIONS}`);
  if (wranglerVars.R2_BUCKET_NAME) {
    console.log(`   R2_BUCKET_NAME: ${wranglerVars.R2_BUCKET_NAME}`);
  }
  console.log('');
  
  // Step 4: Change to project root (mimic Cloudflare Pages Root Directory)
  process.chdir(projectRoot);
  console.log(`📂 Changed working directory to: ${projectRoot}\n`);
  
  // Step 5: Log initial memory
  logMemoryUsage('Initial');
  
  try {
    // Step 6: Run pnpm install (simulating Cloudflare's dependency installation)
    console.log('\n📦 Step 1: Installing dependencies...');
    console.log('   Running: pnpm install\n');
    logMemoryUsage('Before pnpm install');
    
    execSync('pnpm install', {
      stdio: 'inherit',
      cwd: repoRoot, // Run from repo root (where pnpm-workspace.yaml is)
      env: env,
    });
    
    logMemoryUsage('After pnpm install');
    console.log('✓ Dependencies installed successfully\n');
    
    // Step 7: Run build:cf (which runs next build && build-cf.js)
    console.log('🔨 Step 2: Building application...');
    console.log('   Running: pnpm run build:cf\n');
    logMemoryUsage('Before build:cf');
    
    execSync('pnpm run build:cf', {
      stdio: 'inherit',
      cwd: projectRoot, // Run from apps/web
      env: env,
    });
    
    logMemoryUsage('After build:cf');
    console.log('✓ Build completed successfully\n');
    
    // Step 8: Verify output exists
    const outputDir = path.join(projectRoot, '.vercel', 'output', 'static');
    if (fs.existsSync(outputDir)) {
      console.log(`✓ Build output found at: ${outputDir}`);
      const files = fs.readdirSync(outputDir);
      console.log(`   ${files.length} items in output directory`);
    } else {
      console.warn(`⚠ Build output not found at: ${outputDir}`);
    }
    
    // Final memory usage
    logMemoryUsage('Final');
    
    console.log('\n✅ Build simulation completed successfully!');
    console.log('   This build should work on Cloudflare Pages.');
    
  } catch (error) {
    logMemoryUsage('Error State');
    console.error('\n❌ Build simulation failed!');
    console.error(`   Error: ${error.message}`);
    if (error.stdout) {
      console.error('\n   stdout:', error.stdout.toString());
    }
    if (error.stderr) {
      console.error('\n   stderr:', error.stderr.toString());
    }
    console.error('\n   Fix the errors above before deploying to Cloudflare Pages.');
    process.exit(1);
  }
}

// Run the simulation
simulateCloudflareBuild();

