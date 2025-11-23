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
// This MUST be set before any other operations to ensure it's inherited
process.env.TURBOPACK = '0';

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory where this script is located (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');

// Change to project root
process.chdir(projectRoot);

// Create environment object with TURBOPACK=0 set
// Ensure it's explicitly set and cannot be overridden
const buildEnv = { 
  ...process.env, 
  TURBOPACK: '0',
  // Also set NEXT_TURBOPACK=0 as some Next.js versions check this
  NEXT_TURBOPACK: '0'
};

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
    // Ensure TURBOPACK=0 is set in the environment before running adapter
    // The adapter will call pnpm run build, which will call this script again
    execSync('npx @cloudflare/next-on-pages', {
      stdio: 'inherit',
      env: buildEnv,
      // Ensure the environment is passed through
      shell: true,
    });
  } else {
    console.log('Inside adapter - skipping adapter step to avoid loop');
    console.log('TURBOPACK env var:', process.env.TURBOPACK);
  }

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

