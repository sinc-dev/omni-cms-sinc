/**
 * Setup Local Authentication for Testing
 * 
 * Creates test organizations and API keys for local development
 * Run this via the API's seed script or manually via database
 */

import { nanoid } from 'nanoid';

// Test organizations to create
const TEST_ORGANIZATIONS = [
  { id: nanoid(), name: 'Study In Kazakhstan', slug: 'study-in-kazakhstan' },
  { id: nanoid(), name: 'Study in North Cyprus', slug: 'study-in-north-cyprus' },
  { id: nanoid(), name: 'Paris American International University', slug: 'paris-american-international-university' },
];

console.log('📝 SQL to create test organizations and API keys:\n');
console.log('-- Step 1: Create organizations\n');
TEST_ORGANIZATIONS.forEach(org => {
  const now = Math.floor(Date.now() / 1000);
  console.log(`INSERT OR IGNORE INTO organizations (id, name, slug, created_at, updated_at)`);
  console.log(`VALUES ('${org.id}', '${org.name}', '${org.slug}', ${now}, ${now});`);
  console.log('');
});

console.log('\n-- Step 2: Create API keys (you need to hash the keys first)\n');
console.log('-- Generate keys using: node -e "const crypto = require(\'crypto\');');
console.log('--   const key = \'omni_\' + crypto.randomBytes(16).toString(\'hex\');');
console.log('--   console.log(key);"');
console.log('');
console.log('-- Then hash them and insert into api_keys table');
console.log('-- Or use the admin UI to create API keys');

console.log('\n💡 Recommended: Use the admin UI to create API keys');
console.log('   1. Start web app: cd apps/web && pnpm dev');
console.log('   2. Create organizations via UI');
console.log('   3. Create API keys via Organization Settings → API Keys');
console.log('   4. Copy the keys and use them in your import script');

