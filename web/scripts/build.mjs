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
  // Detect if we're being called from within @cloudflare/next-on-pages adapter
  // The adapter runs pnpm run build, which calls this script
  const isInsideAdapter = process.env.VERCEL_CLI_VERSION !== undefined ||
                          process.env.VERCEL === '1' ||
                          process.env.CF_PAGES === '1' ||
                          fs.existsSync(path.join(projectRoot, '.vercel', 'output', 'static'));
  
  if (isInsideAdapter) {
    // We're inside the adapter - just run next build (adapter handles the rest)
    // Explicitly set TURBOPACK=0 in the command to ensure it's available at shell level
    console.log('Inside adapter - running Next.js build with TURBOPACK=0 (using webpack)...');
    execSync('TURBOPACK=0 next build', {
      stdio: 'inherit',
      env: buildEnv,
      shell: true,
    });
    console.log('Next.js build completed successfully!');
  } else {
    // We're called directly (from Cloudflare Pages) - run the adapter
    // The adapter will call pnpm run build, which will call this script again
    // This ensures next build runs exactly once (inside the adapter)
    console.log('Running @cloudflare/next-on-pages adapter...');
    console.log('The adapter will run the build internally with TURBOPACK=0');
    // Note: --projectDir flag is not supported in this version of @cloudflare/next-on-pages
    // The adapter will use the current working directory (which is already /opt/buildhome/repo/web)
    execSync('npx @cloudflare/next-on-pages', {
      stdio: 'inherit',
      env: buildEnv,
      shell: true,
    });
    console.log('Build completed successfully!');
  }
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

