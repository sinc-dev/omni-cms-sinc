/**
 * Create System User for API Operations
 * 
 * Creates the system-user-api user in the Cloudflare database
 * This user is required for API key authentication to work
 */

import { apiRequest } from '../shared/utils/api-client.js';

const BASE_URL = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';

async function createSystemUser() {
  console.log('🔧 Creating system user for API operations...\n');
  console.log(`API Base URL: ${BASE_URL}\n`);

  // Note: This requires direct database access via wrangler
  // Since we can't execute SQL directly via API, we'll provide the SQL command
  
  const sql = `
INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  'system-user-api',
  'api@system.local',
  'System API User',
  0,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
  `.trim();

  console.log('📝 Run this SQL command in Cloudflare D1:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\n💡 To execute:');
  console.log('   wrangler d1 execute omni-cms --command="<paste SQL above>"');
  console.log('\n   Or via Cloudflare Dashboard:');
  console.log('   Workers & Pages → D1 → omni-cms → Execute SQL');
}

createSystemUser().catch(console.error);

