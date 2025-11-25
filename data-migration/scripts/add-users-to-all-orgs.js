/**
 * Add Users and Grant Access to All Organizations
 * 
 * Creates 8 users and grants them access to all organizations in the database
 * with org_admin role.
 * 
 * Usage:
 *   node data-migration/scripts/add-users-to-all-orgs.js
 * 
 * This will generate SQL statements that can be executed via:
 *   wrangler d1 execute omni-cms --command="<paste SQL>"
 * 
 * Or via Cloudflare Dashboard:
 *   Workers & Pages → D1 → omni-cms → Execute SQL
 */

// Users to add
const USERS = [
  { email: 'joseph@studyinnc.com', name: 'Joseph' },
  { email: 'safak@studyinnc.com', name: 'Safak' },
  { email: 'grace@studyinnc.com', name: 'Grace' },
  { email: 'jesse@studyinnc.com', name: 'Jesse' },
  { email: 'abdulraheem@studyinnc.com', name: 'Abdulraheem' },
  { email: 'selman@studyinnc.com', name: 'Selman' },
  { email: 'zahra@studyinnc.com', name: 'Zahra' },
  { email: 'christiane@studyinnc.com', name: 'Christiane' },
];

/**
 * Capitalize first letter of a string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generate SQL to create users
 */
function generateUserCreationSQL() {
  const now = Math.floor(Date.now() / 1000);
  const statements = [];
  
  statements.push('-- Step 1: Create users (if they don\'t exist)');
  statements.push('');
  
  USERS.forEach(user => {
    const name = user.name || capitalize(user.email.split('@')[0]);
    // Generate a deterministic ID based on email hash for consistency
    // In production, you might want to use nanoid, but for SQL we'll use a hash-based approach
    statements.push(`INSERT OR IGNORE INTO users (
  id,
  email,
  name,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  lower(hex(randomblob(16))),
  '${user.email}',
  '${name}',
  0,
  ${now},
  ${now}
);`);
    statements.push('');
  });
  
  return statements.join('\n');
}

/**
 * Generate SQL to grant access to all organizations
 * This uses a subquery approach to get all organizations and the admin role
 */
function generateOrganizationAccessSQL() {
  const statements = [];
  
  statements.push('-- Step 2: Grant access to all organizations');
  statements.push('-- This will add each user to all organizations with org_admin role');
  statements.push('');
  statements.push('-- First, let\'s verify we have the org_admin role');
  statements.push('-- If the role doesn\'t exist, you may need to create it first');
  statements.push('');
  
  // Generate INSERT statements for each user-organization pair
  // We'll use a subquery to get all organizations and the org_admin role
  USERS.forEach(user => {
    statements.push(`-- Grant ${user.email} access to all organizations`);
    statements.push(`INSERT OR IGNORE INTO users_organizations (
  id,
  user_id,
  organization_id,
  role_id,
  created_at,
  updated_at
)
SELECT 
  lower(hex(randomblob(16))) as id,
  u.id as user_id,
  o.id as organization_id,
  r.id as role_id,
  strftime('%s', 'now') as created_at,
  strftime('%s', 'now') as updated_at
FROM users u
CROSS JOIN organizations o
CROSS JOIN roles r
WHERE u.email = '${user.email}'
  AND r.name = 'org_admin'
  AND NOT EXISTS (
    SELECT 1 FROM users_organizations uo
    WHERE uo.user_id = u.id AND uo.organization_id = o.id
  );`);
    statements.push('');
  });
  
  return statements.join('\n');
}

/**
 * Generate verification SQL
 */
function generateVerificationSQL() {
  const statements = [];
  
  statements.push('-- Step 3: Verify the setup');
  statements.push('');
  statements.push('-- Check that all users were created:');
  statements.push('SELECT email, name, is_super_admin FROM users WHERE email IN (');
  statements.push(USERS.map(u => `  '${u.email}'`).join(',\n'));
  statements.push(') ORDER BY email;');
  statements.push('');
  statements.push('-- Check user-organization access:');
  statements.push('SELECT ');
  statements.push('  u.email,');
  statements.push('  u.name as user_name,');
  statements.push('  o.name as org_name,');
  statements.push('  o.slug as org_slug,');
  statements.push('  r.name as role_name');
  statements.push('FROM users_organizations uo');
  statements.push('JOIN users u ON uo.user_id = u.id');
  statements.push('JOIN organizations o ON uo.organization_id = o.id');
  statements.push('JOIN roles r ON uo.role_id = r.id');
  statements.push(`WHERE u.email IN (${USERS.map(u => `'${u.email}'`).join(', ')})`);
  statements.push('ORDER BY u.email, o.name;');
  statements.push('');
  statements.push('-- Count organizations per user:');
  statements.push('SELECT ');
  statements.push('  u.email,');
  statements.push('  COUNT(uo.organization_id) as org_count');
  statements.push('FROM users u');
  statements.push('LEFT JOIN users_organizations uo ON u.id = uo.user_id');
  statements.push(`WHERE u.email IN (${USERS.map(u => `'${u.email}'`).join(', ')})`);
  statements.push('GROUP BY u.email');
  statements.push('ORDER BY u.email;');
  
  return statements.join('\n');
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(70));
  console.log('Add Users and Grant Access to All Organizations');
  console.log('='.repeat(70));
  console.log(`\nUsers to add: ${USERS.length}`);
  USERS.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.email} (${user.name})`);
  });
  console.log('\nRole: org_admin (full organization access)');
  console.log('\n' + '='.repeat(70));
  
  const userSQL = generateUserCreationSQL();
  const accessSQL = generateOrganizationAccessSQL();
  const verifySQL = generateVerificationSQL();
  
  const fullSQL = [
    userSQL,
    accessSQL,
    verifySQL,
  ].join('\n');
  
  console.log('\n📝 Generated SQL:\n');
  console.log('─'.repeat(70));
  console.log(fullSQL);
  console.log('─'.repeat(70));
  
  console.log('\n💡 To execute:');
  console.log('   1. Copy the SQL above');
  console.log('   2. Run via wrangler:');
  console.log('      wrangler d1 execute omni-cms --command="<paste SQL above>"');
  console.log('\n   Or via Cloudflare Dashboard:');
  console.log('      Workers & Pages → D1 → omni-cms → Execute SQL');
  console.log('\n⚠️  Important Notes:');
  console.log('   - The script uses INSERT OR IGNORE to avoid duplicates');
  console.log('   - Users must exist in Cloudflare Access to login');
  console.log('   - Add these emails to Cloudflare Access policies:');
  USERS.forEach(user => {
    console.log(`     - ${user.email}`);
  });
  console.log('\n   Or add the domain @studyinnc.com to Cloudflare Access policies');
  console.log('\n✅ SQL generation complete!');
}

main();

