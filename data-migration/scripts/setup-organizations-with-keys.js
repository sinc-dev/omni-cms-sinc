/**
 * Setup Organizations with API Keys
 * 
 * Creates organizations and generates API keys for each one
 * Saves API keys to a secure file
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateAccessJWT } from '../shared/utils/cloudflare-access-auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';

// Support both direct JWT token OR Application Token credentials
const ADMIN_API_KEY = process.env.ADMIN_API_KEY; // Direct JWT token
const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;
const CF_ACCESS_DOMAIN = process.env.CF_ACCESS_DOMAIN || 'sincdev.cloudflareaccess.com';

const ORGANIZATIONS = [
  {
    name: 'Study In Kazakhstan',
    slug: 'study-in-kazakhstan',
    description: 'Study In Kazakhstan - Your guide to studying in Kazakhstan',
  },
  {
    name: 'Study in North Cyprus',
    slug: 'study-in-north-cyprus',
    description: 'Study in North Cyprus - Your guide to studying in North Cyprus',
  },
  {
    name: 'Paris American International University',
    slug: 'paris-american-international-university',
    description: 'Paris American International University - Academic programs and information',
  },
];

// API key scopes for content management
const API_KEY_SCOPES = [
  'posts:read',
  'posts:create',
  'posts:update',
  'posts:delete',
  'posts:publish',
  'media:read',
  'media:create',
  'media:update',
  'media:delete',
  'taxonomies:read',
  'taxonomies:create',
  'taxonomies:update',
  'taxonomies:delete',
  'post-types:read',
  'custom-fields:read',
  'organizations:read',
];

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Method 1: Use Cloudflare Access JWT token directly
  if (options.authToken) {
    headers['Cf-Access-Jwt-Assertion'] = options.authToken;
  }
  // Method 2: Use Application Token credentials (Cloudflare Access validates at edge)
  else if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = CF_ACCESS_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = CF_ACCESS_CLIENT_SECRET;
  }
  // Fallback: Try ADMIN_API_KEY if set
  else if (ADMIN_API_KEY) {
    headers['Cf-Access-Jwt-Assertion'] = ADMIN_API_KEY;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
    };
  }
}

/**
 * Create an organization
 */
async function createOrganization(org, authToken) {
  console.log(`\nCreating organization: ${org.name}...`);
  
  const result = await apiRequest('/api/admin/v1/organizations', {
    method: 'POST',
    body: JSON.stringify({
      name: org.name,
      slug: org.slug,
      description: org.description,
    }),
    authToken,
  });

  if (!result.ok) {
    if (result.status === 409) {
      console.log(`  ⚠ Organization already exists, fetching existing...`);
      // Try to get existing organization
      const getResult = await apiRequest(`/api/admin/v1/organizations`);
      if (getResult.ok && Array.isArray(getResult.data?.data)) {
        const existing = getResult.data.data.find(o => o.slug === org.slug);
        if (existing) {
          console.log(`  ✓ Found existing organization: ${existing.id}`);
          return existing;
        }
      }
    }
    throw new Error(`Failed to create organization: ${result.status} ${result.statusText} - ${JSON.stringify(result.data)}`);
  }

  const orgData = result.data?.data || result.data;
  console.log(`  ✓ Created organization: ${orgData.id}`);
  return orgData;
}

/**
 * Create an API key for an organization
 */
async function createApiKey(organizationId, orgName, authToken) {
  console.log(`  Creating API key for ${orgName}...`);
  
  const result = await apiRequest(`/api/admin/v1/organizations/${organizationId}/api-keys`, {
    method: 'POST',
    body: JSON.stringify({
      name: `${orgName} - Content Management API Key`,
      scopes: API_KEY_SCOPES,
      rateLimit: 10000, // 10,000 requests per hour
      expiresAt: null, // No expiration
    }),
    authToken,
  });

  if (!result.ok) {
    throw new Error(`Failed to create API key: ${result.status} ${result.statusText} - ${JSON.stringify(result.data)}`);
  }

  const keyData = result.data?.data || result.data;
  const apiKey = keyData.key; // This is only returned on creation
  
  if (!apiKey) {
    throw new Error('API key was created but key value not returned');
  }

  console.log(`  ✓ Created API key: ${keyData.id}`);
  console.log(`  ⚠ IMPORTANT: Save this key now - it won't be shown again!`);
  
  return {
    id: keyData.id,
    name: keyData.name,
    key: apiKey,
    keyPrefix: keyData.keyPrefix,
    scopes: keyData.scopes,
    organizationId,
  };
}

/**
 * Save API keys to file
 */
async function saveApiKeys(apiKeys) {
  const keysFile = path.join(__dirname, '../api-keys.json');
  const envFile = path.join(__dirname, '../.env.api-keys');
  
  // Save as JSON
  const keysData = {
    generatedAt: new Date().toISOString(),
    apiUrl: API_URL,
    organizations: apiKeys.map(k => ({
      organizationId: k.organizationId,
      organizationName: k.organizationName,
      apiKeyId: k.id,
      apiKeyName: k.name,
      keyPrefix: k.keyPrefix,
      key: k.key, // Full key - keep secure!
      scopes: k.scopes,
    })),
  };

  await fs.writeFile(keysFile, JSON.stringify(keysData, null, 2));
  console.log(`\n✓ API keys saved to: ${keysFile}`);

  // Also save as .env format for easy use
  const envContent = [
    `# API Keys for Organizations`,
    `# Generated: ${new Date().toISOString()}`,
    `# API URL: ${API_URL}`,
    ``,
    ...apiKeys.map(k => {
      const envVarName = k.organizationName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      return `${envVarName}_API_KEY=${k.key}`;
    }),
    ``,
    `# Usage example:`,
    `# export STUDY_IN_KAZAKHSTAN_API_KEY="${apiKeys[0]?.key || 'your-key-here'}"`,
  ].join('\n');

  await fs.writeFile(envFile, envContent);
  console.log(`✓ API keys saved to: ${envFile}`);

  // Create .gitignore entry if it doesn't exist
  const gitignorePath = path.join(__dirname, '../.gitignore');
  try {
    const gitignore = await fs.readFile(gitignorePath, 'utf-8');
    if (!gitignore.includes('api-keys.json') || !gitignore.includes('.env.api-keys')) {
      await fs.appendFile(gitignorePath, '\n# API Keys\napi-keys.json\n.env.api-keys\n');
      console.log(`✓ Updated .gitignore`);
    }
  } catch (error) {
    // .gitignore doesn't exist, create it
    await fs.writeFile(gitignorePath, '# API Keys\napi-keys.json\n.env.api-keys\n');
    console.log(`✓ Created .gitignore`);
  }

  return { keysFile, envFile };
}

/**
 * Get authentication method
 * Supports both direct JWT token OR Application Token credentials
 * Returns null if using Application Token (headers will be set in apiRequest)
 */
async function getAuthToken() {
  // Method 1: Direct JWT token
  if (ADMIN_API_KEY) {
    console.log('Using direct JWT token (ADMIN_API_KEY)');
    return ADMIN_API_KEY;
  }

  // Method 2: Application Token credentials
  // These are validated by Cloudflare Access at the edge
  // No need to generate JWT - Cloudflare handles it
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    console.log('Using Application Token credentials (CF-Access-Client-Id + CF-Access-Client-Secret)');
    console.log('Cloudflare Access will validate these at the edge');
    return null; // Return null - headers will be set in apiRequest
  }

  throw new Error('No authentication method provided');
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Setup Organizations with API Keys');
  console.log('='.repeat(60));
  console.log(`\nAPI URL: ${API_URL}`);

  let authToken;
  try {
    authToken = await getAuthToken();
    if (authToken) {
      console.log(`Auth token: ${authToken.substring(0, 20)}...`);
    } else {
      console.log('Using Application Token credentials (will be validated by Cloudflare Access)');
    }
  } catch (error) {
    console.error('\n❌ Error: Authentication required');
    console.error('\nOption 1: Use direct JWT token:');
    console.error('  ADMIN_API_KEY=your-jwt-token node scripts/setup-organizations-with-keys.js');
    console.error('\nOption 2: Use Application Token credentials (RECOMMENDED):');
    console.error('  CF_ACCESS_CLIENT_ID=your-client-id \\');
    console.error('  CF_ACCESS_CLIENT_SECRET=your-client-secret \\');
    console.error('  node scripts/setup-organizations-with-keys.js');
    console.error('\nNote: CF_ACCESS_DOMAIN is optional (defaults to sincdev.cloudflareaccess.com)');
    process.exit(1);
  }

  const results = [];

  // Pass authToken (can be null if using Application Token credentials)
  const authTokenForRequests = authToken;

  for (const org of ORGANIZATIONS) {
    try {
      // Create organization
      const orgData = await createOrganization(org, authTokenForRequests);

      // Create API key
      const apiKey = await createApiKey(orgData.id, org.name, authTokenForRequests);

      results.push({
        ...apiKey,
        organizationName: org.name,
        organizationSlug: org.slug,
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`\n❌ Error setting up ${org.name}:`, error.message);
      console.error('Continuing with next organization...');
    }
  }

  if (results.length === 0) {
    console.error('\n❌ No organizations were created. Please check your ADMIN_API_KEY.');
    process.exit(1);
  }

  // Save API keys
  const { keysFile, envFile } = await saveApiKeys(results);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Setup Complete!');
  console.log('='.repeat(60));
  console.log(`\nCreated ${results.length} organizations with API keys:\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.organizationName}`);
    console.log(`   Organization ID: ${result.organizationId}`);
    console.log(`   API Key ID: ${result.id}`);
    console.log(`   Key Prefix: ${result.keyPrefix}`);
    console.log(`   Full Key: ${result.key.substring(0, 20)}...`);
    console.log('');
  });

  console.log('⚠ IMPORTANT: API keys have been saved to:');
  console.log(`   - ${keysFile}`);
  console.log(`   - ${envFile}`);
  console.log('\n⚠ Keep these files secure and do not commit them to git!');
  console.log('\n✅ Setup complete!');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});

