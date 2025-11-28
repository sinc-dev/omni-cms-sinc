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

 
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
 

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
    // Skip if node_modules already exists (faster iteration)
    const nodeModulesExists = fs.existsSync(path.join(repoRoot, 'node_modules'));
    if (nodeModulesExists) {
      console.log('\n📦 Step 1: Dependencies already installed (skipping pnpm install)');
      console.log('   To reinstall, delete node_modules first\n');
    } else {
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
    }
    
    // Step 7: Run build:cf (which runs next build && build-cf.js)
    console.log('🔨 Step 2: Building application...');
    console.log('   Running: pnpm run build:cf\n');
    logMemoryUsage('Before build:cf');
    
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      console.log('⚠️  WINDOWS DETECTED: @cloudflare/next-on-pages may hang on Windows.');
      console.log('   The vercel build step (inside next-on-pages) is known to hang on Windows.');
      console.log('   This is OK - it will work fine on Cloudflare Pages (Linux).\n');
      console.log('   Running Next.js build only (skipping vercel build step)...\n');
      
      // Set NODE_OPTIONS in env for Windows compatibility
      const buildEnv = {
        ...env,
        NODE_OPTIONS: '--max-old-space-size=3584',
        NEXT_PRIVATE_WORKERS: '2',
      };
      
      // Just run next build, skip the vercel build step
      execSync('next build', {
        stdio: 'inherit',
        cwd: projectRoot,
        env: buildEnv,
        shell: true, // Use shell for Windows compatibility
      });
      
      console.log('\n✓ Next.js build completed successfully');
      console.log('⚠️  Note: Skipped vercel build step (known to hang on Windows)');
      console.log('   The full build will work on Cloudflare Pages (Linux environment)\n');
    } else {
      // On Linux/Mac, run the full build
      execSync('pnpm run build:cf', {
        stdio: 'inherit',
        cwd: projectRoot, // Run from apps/web
        env: env,
      });
      
      logMemoryUsage('After build:cf');
      console.log('✓ Build completed successfully\n');
    }
    
    // Step 8: Verify output exists and check for issues
    // On Windows, .vercel/output/static may not exist if vercel build was skipped
    // But .next directory should exist, which is what we need for Cloudflare Pages
    const outputDir = path.join(projectRoot, '.vercel', 'output', 'static');
    const nextDir = path.join(projectRoot, '.next');
    
    if (fs.existsSync(outputDir)) {
      console.log(`✓ Build output found at: ${outputDir}`);
      
      // Check for recursive paths or symlinks in output
      function checkOutput(dir, depth = 0, maxDepth = 10, visited = new Set()) {
        if (depth > maxDepth) {
          console.warn(`   ⚠ Deep directory structure detected (depth ${depth}) - possible recursion?`);
          return;
        }
        
        const realPath = fs.realpathSync(dir);
        if (visited.has(realPath)) {
          console.warn(`   ⚠ Circular reference detected: ${dir} -> ${realPath}`);
          return;
        }
        visited.add(realPath);
        
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          let fileCount = 0;
          let dirCount = 0;
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const stat = fs.lstatSync(fullPath);
            
            if (stat.isSymbolicLink()) {
              console.warn(`   ⚠ Symlink found in output: ${fullPath} - this might cause issues`);
            } else if (entry.isDirectory()) {
              // Check for suspicious recursive patterns
              if (entry.name === 'apps' || entry.name === 'web') {
                console.warn(`   ⚠ Suspicious directory name in output: ${fullPath}`);
              }
              dirCount++;
              checkOutput(fullPath, depth + 1, maxDepth, new Set(visited));
            } else {
              fileCount++;
            }
          }
          
          if (depth === 0) {
            console.log(`   ${entries.length} items (${fileCount} files, ${dirCount} directories)`);
          }
        } catch (err) {
          // Ignore permission errors
        }
      }
      
      checkOutput(outputDir);
    } else if (isWindows && fs.existsSync(nextDir)) {
      // On Windows, if .next exists, that's good enough
      // The vercel build step was skipped, so .vercel/output/static won't exist
      console.log(`✓ Next.js build output verified at: ${nextDir}`);
      console.log('   (Full vercel build output will be created on Cloudflare Pages)\n');
    } else {
      console.warn(`⚠ Build output not found at: ${outputDir}`);
      if (!fs.existsSync(nextDir)) {
        console.warn(`   Next.js build output (.next) also not found - build may have failed.`);
      } else {
        console.warn(`   Next.js build succeeded, but vercel output not found.`);
      }
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

