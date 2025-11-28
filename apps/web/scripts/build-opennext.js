#!/usr/bin/env node
/**
 * Build script for Cloudflare Pages using OpenNext adapter
 * This replaces the old build-cf.js which used deprecated @cloudflare/next-on-pages
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// Ensure we're running from the correct directory
process.chdir(projectRoot);

// Verify .next directory exists (Next.js build output)
if (!fs.existsSync(path.join(projectRoot, '.next'))) {
  console.error('✗ Error: .next directory not found. Make sure Next.js build completed successfully.');
  process.exit(1);
}

// Verify open-next.config.ts exists, create if missing (CLI expects hyphenated name)
const configPath = path.join(projectRoot, 'open-next.config.ts');
if (!fs.existsSync(configPath)) {
  console.warn('⚠ open-next.config.ts not found, creating default config...');
  const defaultConfig = `import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
`;
  fs.writeFileSync(configPath, defaultConfig, 'utf8');
  console.log('✓ Created open-next.config.ts');
} else {
  console.log('✓ Found open-next.config.ts');
}

// Verify config file is readable
try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  if (!configContent.trim()) {
    throw new Error('Config file is empty');
  }
  console.log('✓ Config file is valid');
} catch (error) {
  console.error(`✗ Error reading config file: ${error.message}`);
  process.exit(1);
}

console.log('⚡ Running OpenNext Cloudflare adapter...');
console.log(`   Working directory: ${projectRoot}`);
console.log(`   Output directory: .open-next`);

try {
  // Set environment variables
  const env = {
    ...process.env,
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=3584',
  };

  console.log(`   NODE_OPTIONS: ${env.NODE_OPTIONS}`);

  // Run OpenNext build
  // OpenNext handles all the transformation and optimization
  // Config file is ensured to exist above, so no prompts should appear
  execSync('npx opennextjs-cloudflare build', {
    stdio: 'inherit',
    cwd: projectRoot,
    env: env,
    timeout: 600000, // 10 minute timeout
  });

  // Verify output
  const outputDir = path.join(projectRoot, '.open-next');
  if (fs.existsSync(outputDir)) {
    console.log('✓ OpenNext build complete');
    console.log(`✓ Build output verified at: ${outputDir}`);
  } else {
    console.warn('⚠ Build completed but output directory not found');
  }

  console.log('✅ Cloudflare Pages build complete!');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
