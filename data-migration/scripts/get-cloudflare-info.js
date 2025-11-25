/**
 * Get Cloudflare Account ID and Access Application IDs
 * 
 * This script helps you find your Account ID and Access Application IDs
 * using your Cloudflare API token.
 * 
 * Usage:
 *   CLOUDFLARE_API_TOKEN=your-token node data-migration/scripts/get-cloudflare-info.js
 * 
 * Or put credentials in .env file in data-migration directory
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file if it exists (check multiple locations)
const envPaths = [
  join(__dirname, '../../.env'),
  join(__dirname, '../../../.env'),
];

for (const envPath of envPaths) {
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          // Remove quotes and trim whitespace
          let value = valueParts.join('=').trim();
          value = value.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
          value = value.replace(/^`|`$/g, ''); // Remove backticks
          value = value.trim(); // Final trim
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
    console.log(`✓ Loaded .env from ${envPath}`);
    break;
  } catch (error) {
    // .env file doesn't exist, try next path
  }
}

// Check for common Cloudflare Access variable names and set default
if (!process.env.CLOUDFLARE_API_TOKEN) {
  process.env.CLOUDFLARE_API_TOKEN = process.env.CF_API_TOKEN ||
                                      process.env.CLOUDFLARE_TOKEN ||
                                      '';
}

// Get and clean the API token
let CLOUDFLARE_API_TOKEN = (process.env.CLOUDFLARE_API_TOKEN || '').trim();
// Remove any quotes, backticks, or newlines that might be in the value
CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN
  .replace(/^["']|["']$/g, '') // Remove surrounding quotes
  .replace(/^`|`$/g, '') // Remove backticks
  .replace(/\r?\n/g, '') // Remove newlines
  .trim();

// Debug: Show what token we're using
if (CLOUDFLARE_API_TOKEN) {
  console.log(`✓ Found API token: ${CLOUDFLARE_API_TOKEN.substring(0, 10)}... (length: ${CLOUDFLARE_API_TOKEN.length})`);
  // Check if token looks valid (Cloudflare API tokens are usually 40+ chars)
  if (CLOUDFLARE_API_TOKEN.length < 40) {
    console.log(`⚠️  Warning: Token seems short. Cloudflare API tokens are usually 40+ characters.`);
  }
} else {
  console.log('⚠️  No API token found in CLOUDFLARE_API_TOKEN');
  console.log('   Checked: CLOUDFLARE_API_TOKEN, CF_API_TOKEN, CLOUDFLARE_TOKEN');
}

async function cloudflareRequest(endpoint, method = 'GET', body = null) {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  
  const CF_ACCESS_CLIENT_ID = (process.env.CF_ACCESS_CLIENT_ID || '').trim();
  const CF_ACCESS_CLIENT_SECRET = (process.env.CF_ACCESS_CLIENT_SECRET || '').trim();
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Use API Token (required for Cloudflare API)
  // Note: CF_ACCESS_CLIENT_ID/SECRET are for authenticating TO Access-protected apps,
  // not for using the Cloudflare API to manage Access policies
  if (CLOUDFLARE_API_TOKEN && CLOUDFLARE_API_TOKEN.length >= 40) {
    const cleanToken = CLOUDFLARE_API_TOKEN.replace(/\r?\n/g, '').trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
  } else {
    throw new Error(
      'CLOUDFLARE_API_TOKEN is required for Cloudflare API access.\n' +
      'Note: CF_ACCESS_CLIENT_ID/SECRET are for authenticating TO Access-protected apps,\n' +
      'not for managing Access policies via the API.\n\n' +
      'To create an API Token:\n' +
      '1. Go to https://dash.cloudflare.com/profile/api-tokens\n' +
      '2. Create Token → Use template "Zero Trust: Read and Write"\n' +
      '3. Copy the token (should be 40+ characters)\n' +
      '4. Add to .env: CLOUDFLARE_API_TOKEN=your-token-here'
    );
  }

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

async function main() {
  console.log('='.repeat(70));
  console.log('Cloudflare Account & Access Application Info');
  console.log('='.repeat(70));

  if (!CLOUDFLARE_API_TOKEN) {
    console.error('\n❌ Error: CLOUDFLARE_API_TOKEN environment variable is required');
    console.error('\n💡 Set it with:');
    console.error('   $env:CLOUDFLARE_API_TOKEN="your-token"');
    process.exit(1);
  }

  try {
    // Get account info
    console.log('\n📋 Fetching account information...');
    const accountsResponse = await cloudflareRequest('/accounts');
    const accounts = accountsResponse.result || [];

    if (accounts.length === 0) {
      console.error('\n❌ No accounts found');
      process.exit(1);
    }

    console.log('\n✅ Found Account(s):');
    accounts.forEach((account, index) => {
      console.log(`\n${index + 1}. Account Name: ${account.name}`);
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Type: ${account.type}`);
    });

    const accountId = accounts[0].id;
    console.log(`\n📝 Using Account ID: ${accountId}`);

    // Get Access Applications
    console.log('\n📋 Fetching Access Applications...');
    const appsResponse = await cloudflareRequest(`/accounts/${accountId}/access/apps`);
    const apps = appsResponse.result || [];

    if (apps.length === 0) {
      console.log('\n⚠️  No Access Applications found');
      console.log('   You may need to create one in Cloudflare Dashboard first.');
    } else {
      console.log(`\n✅ Found ${apps.length} Access Application(s):`);
      apps.forEach((app, index) => {
        console.log(`\n${index + 1}. Application Name: ${app.name || 'Unnamed'}`);
        console.log(`   Application ID: ${app.id}`);
        console.log(`   Domain: ${app.domain || 'N/A'}`);
        console.log(`   Type: ${app.type || 'N/A'}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 To use these values:');
    console.log('='.repeat(70));
    console.log(`\n$env:CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN.substring(0, 10)}..."`);
    console.log(`$env:CLOUDFLARE_ACCOUNT_ID="${accountId}"`);
    if (apps.length > 0) {
      console.log(`$env:CLOUDFLARE_ACCESS_APP_ID="${apps[0].id}"`);
    } else {
      console.log(`$env:CLOUDFLARE_ACCESS_APP_ID="<get-from-dashboard>"`);
    }
    console.log('\nThen run:');
    console.log('node data-migration/scripts/add-users-to-cloudflare-access.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your API token is correct');
    console.error('   2. Ensure token has Zero Trust read permissions');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});

