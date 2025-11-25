/**
 * Add Users to Cloudflare Access Policies
 * 
 * This script adds users to Cloudflare Access policies via the Cloudflare API.
 * 
 * Prerequisites:
 * 1. Cloudflare API Token with Zero Trust permissions
 * 2. Account ID
 * 3. Application ID (Access Application ID)
 * 
 * Usage:
 *   CLOUDFLARE_API_TOKEN=your-token \
 *   CLOUDFLARE_ACCOUNT_ID=your-account-id \
 *   CLOUDFLARE_ACCESS_APP_ID=your-app-id \
 *   node data-migration/scripts/add-users-to-cloudflare-access.js
 * 
 * Or put credentials in .env file in data-migration directory
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file if it exists
try {
  const envPath = join(__dirname, '../../.env');
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  // .env file doesn't exist or can't be read, that's okay
}

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ACCESS_APP_ID = process.env.CLOUDFLARE_ACCESS_APP_ID;

// Users to add
const USERS = [
  'joseph@studyinnc.com',
  'safak@studyinnc.com',
  'grace@studyinnc.com',
  'jesse@studyinnc.com',
  'abdulraheem@studyinnc.com',
  'selman@studyinnc.com',
  'zahra@studyinnc.com',
  'christiane@studyinnc.com',
];

/**
 * Make API request to Cloudflare
 */
async function cloudflareRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Get Access Application policies
 */
async function getAccessPolicies(accountId, appId) {
  const response = await cloudflareRequest(
    `/accounts/${accountId}/access/apps/${appId}/policies`
  );
  return response.result || [];
}

/**
 * Update Access Application policy to include users
 */
async function updateAccessPolicy(accountId, appId, policyId, policy) {
  const response = await cloudflareRequest(
    `/accounts/${accountId}/access/apps/${appId}/policies/${policyId}`,
    'PUT',
    policy
  );
  return response.result;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Add Users to Cloudflare Access Policies');
  console.log('='.repeat(70));

  // Validate environment variables
  if (!CLOUDFLARE_API_TOKEN) {
    console.error('\n❌ Error: CLOUDFLARE_API_TOKEN environment variable is required');
    console.error('\n💡 To get an API token:');
    console.error('   1. Go to Cloudflare Dashboard → My Profile → API Tokens');
    console.error('   2. Create a token with "Zero Trust" permissions');
    console.error('   3. Export it: export CLOUDFLARE_API_TOKEN=your-token');
    process.exit(1);
  }

  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('\n❌ Error: CLOUDFLARE_ACCOUNT_ID environment variable is required');
    console.error('\n💡 To get your Account ID:');
    console.error('   1. Go to Cloudflare Dashboard → Right sidebar');
    console.error('   2. Copy your Account ID');
    console.error('   3. Export it: export CLOUDFLARE_ACCOUNT_ID=your-account-id');
    process.exit(1);
  }

  if (!CLOUDFLARE_ACCESS_APP_ID) {
    console.error('\n❌ Error: CLOUDFLARE_ACCESS_APP_ID environment variable is required');
    console.error('\n💡 To get your Access Application ID:');
    console.error('   1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications');
    console.error('   2. Click on your CMS application');
    console.error('   3. The Application ID is in the URL or API section');
    console.error('   4. Export it: export CLOUDFLARE_ACCESS_APP_ID=your-app-id');
    process.exit(1);
  }

  console.log(`\nAccount ID: ${CLOUDFLARE_ACCOUNT_ID}`);
  console.log(`Application ID: ${CLOUDFLARE_ACCESS_APP_ID}`);
  console.log(`Users to add: ${USERS.length}`);
  USERS.forEach((email, index) => {
    console.log(`  ${index + 1}. ${email}`);
  });

  try {
    console.log('\n📋 Fetching existing policies...');
    const policies = await getAccessPolicies(CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_APP_ID);

    if (policies.length === 0) {
      console.error('\n❌ No policies found for this application.');
      console.error('   Please create a policy first via Cloudflare Dashboard.');
      process.exit(1);
    }

    console.log(`✓ Found ${policies.length} policy/policies`);

    // Update each policy to include the new users
    for (const policy of policies) {
      console.log(`\n📝 Updating policy: ${policy.name || policy.id}`);

      // Build include array with existing includes + new users
      const existingIncludes = policy.include || [];
      const newUserIncludes = USERS.map(email => ({
        email: { email },
      }));

      // Combine existing includes with new users
      // Remove duplicates if any user email already exists
      const allIncludes = [...existingIncludes];
      for (const userInclude of newUserIncludes) {
        const emailExists = allIncludes.some(
          inc => inc.email?.email === userInclude.email.email
        );
        if (!emailExists) {
          allIncludes.push(userInclude);
        }
      }

      // Update policy
      const updatedPolicy = {
        ...policy,
        include: allIncludes,
      };

      // Remove fields that shouldn't be sent in update
      delete updatedPolicy.created_at;
      delete updatedPolicy.updated_at;

      await updateAccessPolicy(
        CLOUDFLARE_ACCOUNT_ID,
        CLOUDFLARE_ACCESS_APP_ID,
        policy.id,
        updatedPolicy
      );

      console.log(`  ✓ Updated policy "${policy.name || policy.id}"`);
      console.log(`    Added ${USERS.length} users to include list`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Successfully added users to Cloudflare Access policies!');
    console.log('='.repeat(70));
    console.log('\n📧 Users can now login to the frontend:');
    USERS.forEach(email => {
      console.log(`   - ${email}`);
    });
    console.log('\n💡 Note: Users may need to authenticate via Cloudflare Access');
    console.log('   (SSO, Email OTP, etc.) based on your identity provider configuration.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your API token has Zero Trust permissions');
    console.error('   2. Check that Account ID and Application ID are correct');
    console.error('   3. Ensure the application exists in Cloudflare Access');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});

