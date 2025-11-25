#!/usr/bin/env tsx
/**
 * Configuration Check Script
 * 
 * This script helps verify that all required configuration is in place
 * for the Cloudflare Pages deployment.
 * 
 * Usage: pnpm tsx scripts/check-configuration.ts
 */

import { checkConfiguration } from '../src/lib/config/check';

console.log('🔍 Checking Cloudflare Pages Configuration...\n');

// Check environment variables
const envVars = {
  CF_ACCESS_TEAM_DOMAIN: process.env.CF_ACCESS_TEAM_DOMAIN,
  CF_ACCESS_AUD: process.env.CF_ACCESS_AUD,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
};

console.log('Environment Variables:');
console.log('─'.repeat(50));

let hasErrors = false;
let hasWarnings = false;

// Check required variables
const requiredVars = ['CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD'];
for (const varName of requiredVars) {
  if (envVars[varName as keyof typeof envVars]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: MISSING (Required)`);
    hasErrors = true;
  }
}

// Check recommended variables
const recommendedVars = ['NEXT_PUBLIC_APP_URL', 'R2_ACCOUNT_ID', 'R2_BUCKET_NAME'];
for (const varName of recommendedVars) {
  if (envVars[varName as keyof typeof envVars]) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`⚠️  ${varName}: Not set (Recommended)`);
    hasWarnings = true;
  }
}

console.log('\n📋 Configuration Summary:');
console.log('─'.repeat(50));

if (hasErrors) {
  console.log('❌ Configuration has ERRORS - Fix required variables above');
  console.log('\n💡 Next Steps:');
  console.log('1. Go to Cloudflare Dashboard → Pages → omni-cms-sinc');
  console.log('2. Settings → Environment Variables → Production');
  console.log('3. Add missing variables');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Configuration has warnings - Some recommended variables are missing');
  console.log('   The application may work, but some features might not function correctly');
  process.exit(0);
} else {
  console.log('✅ All configuration looks good!');
  console.log('\n📝 Note: This script only checks environment variables.');
  console.log('   Database bindings must be configured in Cloudflare Pages dashboard:');
  console.log('   Settings → Functions → D1 Database bindings');
  process.exit(0);
}

