/**
 * Generate SQL to create organizations and API keys for local testing
 * 
 * This script generates the SQL with properly hashed API keys
 */

import crypto from 'crypto';
import { nanoid } from 'nanoid';

/**
 * Generate API key
 */
function generateApiKey() {
  const randomBytes = crypto.randomBytes(16);
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `omni_${key}`;
}

/**
 * Hash API key using SHA-256
 */
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Get key prefix (first 8 chars after 'omni_')
 */
function getKeyPrefix(key) {
  if (!key.startsWith('omni_')) {
    return key.substring(0, 8);
  }
  return key.substring(5, 13); // After 'omni_', take 8 chars
}

// Organizations to create
const organizations = [
  { name: 'Study In Kazakhstan', slug: 'study-in-kazakhstan' },
  { name: 'Study in North Cyprus', slug: 'study-in-north-cyprus' },
  { name: 'Paris American International University', slug: 'paris-american-international-university' },
];

// Generate SQL
const now = Math.floor(Date.now() / 1000);
const scopes = JSON.stringify(['*']); // All permissions

console.log('-- ============================================================');
console.log('-- SQL to create organizations and API keys for local testing');
console.log('-- ============================================================\n');

console.log('-- Step 1: Create Organizations\n');
organizations.forEach((org, index) => {
  const orgId = nanoid();
  org._id = orgId; // Store for API key creation
  
  console.log(`-- ${org.name}`);
  console.log(`INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)`);
  console.log(`VALUES ('${orgId}', '${org.name}', '${org.slug}', ${now}, ${now});`);
  console.log('');
});

console.log('\n-- Step 2: Create API Keys\n');
console.log('-- IMPORTANT: Copy these API keys - you will need them for authentication!\n');

const apiKeys = [];

organizations.forEach((org) => {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  const keyPrefix = getKeyPrefix(apiKey);
  const keyId = nanoid();
  
  apiKeys.push({
    orgId: org._id,
    orgSlug: org.slug,
    apiKey,
    hashedKey,
    keyPrefix,
    keyId,
  });
  
  console.log(`-- API Key for ${org.name} (${org.slug})`);
  console.log(`-- KEY: ${apiKey}`);
  console.log(`INSERT OR IGNORE INTO api_keys (`);
  console.log(`  id, organization_id, name, key, key_prefix, scopes, rate_limit, created_at, updated_at`);
  console.log(`) VALUES (`);
  console.log(`  '${keyId}',`);
  console.log(`  '${org._id}',`);
  console.log(`  'Test Import Key - ${org.slug}',`);
  console.log(`  '${hashedKey}',`);
  console.log(`  '${keyPrefix}',`);
  console.log(`  '${scopes}',`);
  console.log(`  10000,`);
  console.log(`  ${now},`);
  console.log(`  ${now}`);
  console.log(`);`);
  console.log('');
});

console.log('\n-- ============================================================');
console.log('-- API Keys (save these for use in import script!)');
console.log('-- ============================================================\n');

apiKeys.forEach(({ orgSlug, apiKey }) => {
  console.log(`-- ${orgSlug}: ${apiKey}`);
});

console.log('\n-- ============================================================');
console.log('-- Usage in PowerShell:');
console.log('-- ============================================================\n');

apiKeys.forEach(({ orgSlug, apiKey }) => {
  console.log(`-- For ${orgSlug}:`);
  console.log(`-- $env:OMNI_CMS_API_KEY="${apiKey}"`);
});

console.log('\n-- Or use all keys:');
console.log(`-- $env:OMNI_CMS_API_KEY="${apiKeys[0].apiKey}"`);
console.log('\n-- Then run: npm run import\n');

