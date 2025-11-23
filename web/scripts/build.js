#!/usr/bin/env node
/**
 * Build script wrapper that ensures TURBOPACK=0 is set for all build processes.
 * This is needed because @cloudflare/next-on-pages runs the build command again
 * internally, and it needs to inherit the TURBOPACK environment variable.
 * 
 * Setting TURBOPACK=0 ensures webpack is used instead of Turbopack, which is
 * required for @cloudflare/next-on-pages compatibility.
 */
// Set TURBOPACK=0 in the environment so it's available to all child processes
process.env.TURBOPACK = '0';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this script is located
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Change to project root
process.chdir(projectRoot);

// Create environment object with TURBOPACK=0 set
const buildEnv = { ...process.env, TURBOPACK: '0' };

try {
  console.log('Building with TURBOPACK=0 (using webpack instead of Turbopack)...');
  execSync('next build', {
    stdio: 'inherit',
    env: buildEnv,
  });

  // Only run the adapter if we're not already inside it
  // @cloudflare/next-on-pages will call this script again internally
  // Check for Vercel CLI environment or if adapter output already exists
  const isInsideAdapter = process.env.VERCEL_CLI_VERSION !== undefined ||
                          process.env.VERCEL === '1' ||
                          fs.existsSync(path.join(projectRoot, '.vercel', 'output', 'static'));
  
  if (!isInsideAdapter) {
    console.log('Running @cloudflare/next-on-pages adapter...');
    execSync('npx @cloudflare/next-on-pages', {
      stdio: 'inherit',
      env: buildEnv,
    });
  } else {
    console.log('Inside adapter - skipping adapter step to avoid loop');
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

