/**
 * Create a test API key for local development
 * 
 * This script helps create an API key in the local database for testing imports
 */

import { getDb } from '../../apps/api/src/db/client.js';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../../apps/api/src/lib/api/api-keys.js';
import { nanoid } from 'nanoid';
import { apiKeys } from '../../apps/api/src/db/schema/api-keys.js';

/**
 * Create a test API key for an organization
 */
async function createTestApiKey(organizationId, organizationSlug) {
  // This would need to run in the API context to access the database
  // For now, this is a helper script - you'll need to run it via the API or manually
  
  console.log('To create an API key for local testing:');
  console.log('');
  console.log('Option 1: Use the admin UI');
  console.log('  1. Start the web app: cd apps/web && pnpm dev');
  console.log('  2. Log in and go to Organization Settings → API Keys');
  console.log('  3. Create a new API key');
  console.log('');
  console.log('Option 2: Create via database (if you have direct DB access)');
  console.log('  Run this SQL in your local D1 database:');
  console.log('');
  
  const testKey = await generateApiKey();
  const keyPrefix = getKeyPrefix(testKey);
  const hashedKey = await hashApiKey(testKey);
  
  console.log(`  INSERT INTO api_keys (id, organization_id, name, key_prefix, key, scopes, created_at, updated_at)`);
  console.log(`  VALUES (`);
  console.log(`    '${nanoid()}',`);
  console.log(`    '${organizationId}',`);
  console.log(`    'Test Import Key',`);
  console.log(`    '${keyPrefix}',`);
  console.log(`    '${hashedKey}',`);
  console.log(`    '["*"]',`);
  console.log(`    datetime('now'),`);
  console.log(`    datetime('now')`);
  console.log(`  );`);
  console.log('');
  console.log(`  Your API key: ${testKey}`);
  console.log('');
  console.log('Then use it:');
  console.log(`  $env:OMNI_CMS_API_KEY="${testKey}"`);
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const orgId = process.argv[2];
  const orgSlug = process.argv[3] || 'test-org';
  
  if (!orgId) {
    console.error('Usage: node create-test-api-key.js <organization-id> [organization-slug]');
    console.error('');
    console.error('To find organization ID:');
    console.error('  1. Check your database: SELECT id, slug FROM organizations;');
    console.error('  2. Or create one via admin UI first');
    process.exit(1);
  }
  
  createTestApiKey(orgId, orgSlug).catch(console.error);
}

export { createTestApiKey };

