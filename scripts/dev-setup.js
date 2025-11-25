#!/usr/bin/env node

/**
 * Local Development Setup Script
 * 
 * This script helps set up the local development environment by:
 * - Creating .env.local from env.example if it doesn't exist
 * - Providing next steps for configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local development environment...\n');

const webDir = path.join(__dirname, '..', 'apps', 'web');
const webEnvLocalPath = path.join(webDir, '.env.local');
const webEnvDevPath = path.join(webDir, '.env.development');
const webEnvDevAltPath = path.join(webDir, '.env.dev');

// Check for web .env.local
if (!fs.existsSync(webEnvLocalPath)) {
  // Prefer .env.development (standard Next.js), fallback to .env.dev
  if (fs.existsSync(webEnvDevPath)) {
    fs.copyFileSync(webEnvDevPath, webEnvLocalPath);
    console.log('✅ Created apps/web/.env.local from .env.development');
  } else if (fs.existsSync(webEnvDevAltPath)) {
    fs.copyFileSync(webEnvDevAltPath, webEnvLocalPath);
    console.log('✅ Created apps/web/.env.local from .env.dev');
  } else {
    const webExamplePath = path.join(webDir, 'env.example');
    if (fs.existsSync(webExamplePath)) {
      fs.copyFileSync(webExamplePath, webEnvLocalPath);
      console.log('✅ Created apps/web/.env.local from env.example');
    } else {
      console.log('⚠️  Warning: No environment template found\n');
    }
  }
  console.log('   Please edit apps/web/.env.local with your actual credentials\n');
} else {
  console.log('✅ apps/web/.env.local already exists\n');
}

// Create .env.development if it doesn't exist
if (!fs.existsSync(webEnvDevPath)) {
  const devContent = `# Development Environment Configuration
# This file is automatically loaded when NODE_ENV=development

NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_APP_URL=http://localhost:3000

CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=omni-cms-media
R2_PUBLIC_URL=https://media.example.com
CF_ACCESS_TEAM_DOMAIN=your-team.cloudflareaccess.com
CF_ACCESS_AUD=your-access-aud
`;
  fs.writeFileSync(webEnvDevPath, devContent);
  console.log('✅ Created apps/web/.env.development with development defaults\n');
}

// Create .env.production if it doesn't exist
const webEnvProdPath = path.join(webDir, '.env.production');
if (!fs.existsSync(webEnvProdPath)) {
  const prodContent = `# Production Environment Configuration
# This file is automatically loaded when NODE_ENV=production

NEXT_PUBLIC_API_URL=https://omni-cms-api.joseph-9a2.workers.dev
NEXT_PUBLIC_APP_URL=https://omni-cms-sinc.joseph-9a2.workers.dev

CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=omni-cms-media
R2_PUBLIC_URL=https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com
CF_ACCESS_TEAM_DOMAIN=sincdev.cloudflareaccess.com
CF_ACCESS_AUD=7291b33d4c255188f0d63a05cf91f9e72e1e6606fb2acb148360886c42e52083
`;
  fs.writeFileSync(webEnvProdPath, prodContent);
  console.log('✅ Created apps/web/.env.production with production defaults\n');
}

// Check for API .dev.vars
const apiDevVarsPath = path.join(__dirname, '..', 'apps', 'api', '.dev.vars');
if (!fs.existsSync(apiDevVarsPath)) {
  console.log('ℹ️  Tip: Create apps/api/.dev.vars for local R2 credentials');
  console.log('   Format: R2_ACCESS_KEY_ID=your-key\n');
} else {
  console.log('✅ apps/api/.dev.vars exists\n');
}

console.log('📋 Next steps:');
console.log('   1. Edit apps/web/.env.local with your Cloudflare credentials');
console.log('   2. Set backend secrets (choose one):');
console.log('      Option A: cd apps/api && wrangler secret put R2_ACCESS_KEY_ID');
console.log('      Option B: Create apps/api/.dev.vars with R2 credentials');
console.log('   3. Run database migrations: pnpm db:migrate');
console.log('   4. Start development servers: pnpm dev:all\n');
console.log('📖 For detailed instructions, see LOCAL_DEV.md\n');

