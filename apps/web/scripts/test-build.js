#!/usr/bin/env node
/**
 * Test script to verify OpenNext setup
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing OpenNext Cloudflare Setup\n');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Test 1: Check if package is installed
console.log('1. Checking if @opennextjs/cloudflare is installed...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const hasOpenNext = packageJson.devDependencies && packageJson.devDependencies['@opennextjs/cloudflare'];
  if (hasOpenNext) {
    console.log(`   ✓ Package found in package.json: ${hasOpenNext}`);
  } else {
    console.log('   ✗ Package not found in package.json');
    process.exit(1);
  }
} catch (error) {
  console.error('   ✗ Error reading package.json:', error.message);
  process.exit(1);
}

// Test 2: Check if node_modules has the package
console.log('\n2. Checking if package is installed in node_modules...');
const nodeModulesPath = path.join(projectRoot, 'node_modules', '@opennextjs', 'cloudflare');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✓ Package found in node_modules');
} else {
  console.log('   ⚠ Package not found in node_modules - run pnpm install');
}

// Test 3: Check if opennext.config.ts exists
console.log('\n3. Checking configuration file...');
const configPath = path.join(projectRoot, 'opennext.config.ts');
if (fs.existsSync(configPath)) {
  console.log('   ✓ opennext.config.ts exists');
} else {
  console.log('   ✗ opennext.config.ts not found');
}

// Test 4: Check wrangler.toml
console.log('\n4. Checking wrangler.toml...');
const wranglerPath = path.join(projectRoot, 'wrangler.toml');
if (fs.existsSync(wranglerPath)) {
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  if (wranglerContent.includes('.open-next')) {
    console.log('   ✓ wrangler.toml has .open-next output directory');
  } else {
    console.log('   ⚠ wrangler.toml might not have correct output directory');
  }
  if (wranglerContent.includes('2025-03-25')) {
    console.log('   ✓ wrangler.toml has correct compatibility_date');
  } else {
    console.log('   ⚠ wrangler.toml compatibility_date might need update');
  }
} else {
  console.log('   ✗ wrangler.toml not found');
}

// Test 5: Try to run the command (dry run)
console.log('\n5. Testing OpenNext command availability...');
try {
  // Just check if the command exists, don't actually run it
  const { execSync } = require('child_process');
  execSync('npx opennextjs-cloudflare --version', { 
    stdio: 'pipe',
    cwd: projectRoot,
    timeout: 10000,
  });
  console.log('   ✓ OpenNext CLI is available');
} catch (error) {
  if (error.message.includes('timeout')) {
    console.log('   ⚠ Command timed out (might need to install package)');
  } else {
    console.log('   ⚠ Command not available:', error.message.split('\n')[0]);
    console.log('   → Run: pnpm install');
  }
}

console.log('\n✅ Setup check complete!');
console.log('\nTo test the build, run:');
console.log('  pnpm run build:cf');
