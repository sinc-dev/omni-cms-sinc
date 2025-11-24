/**
 * Test R2 Configuration
 * 
 * Tests if R2 credentials are properly configured by requesting an upload URL
 */

import { getOrganizationId } from '../shared/utils/api-client.js';

const BASE_URL = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
const ORG_SLUG = process.env.TEST_ORG_SLUG || 'study-in-north-cyprus';
const API_KEY = process.env.OMNI_CMS_API_KEY;

async function testR2Config() {
  console.log('🧪 Testing R2 Configuration...\n');
  console.log(`API Base URL: ${BASE_URL}`);
  console.log(`Organization Slug: ${ORG_SLUG}\n`);

  if (!API_KEY) {
    console.error('❌ No API key found. Set OMNI_CMS_API_KEY environment variable.');
    console.error('   Example: $env:OMNI_CMS_API_KEY="omni_your_api_key_here"');
    process.exit(1);
  }

  // Get organization ID from slug
  console.log('🔍 Getting organization ID...');
  let orgId;
  try {
    orgId = await getOrganizationId(BASE_URL, ORG_SLUG, API_KEY);
    console.log(`   ✓ Organization ID: ${orgId}\n`);
  } catch (error) {
    console.error(`   ❌ Failed to get organization ID: ${error.message}`);
    process.exit(1);
  }

  const url = `${BASE_URL}/api/admin/v1/organizations/${orgId}/media`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  // Test request: Request upload URL for a small test file
  const requestBody = {
    filename: 'test-r2-config.txt',
    mimeType: 'text/plain',
    fileSize: 10, // 10 bytes
  };

  console.log('📤 Requesting upload URL...');
  console.log(`   POST ${url}`);
  console.log(`   Body:`, JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`\n❌ Request failed with status ${response.status}`);
      console.error(`Response: ${responseText}`);
      
      if (responseText.includes('Missing R2 environment variables')) {
        console.error('\n💡 Make sure:');
        console.error('   1. Your API server is running');
        console.error('   2. You have restarted the server after adding .dev.vars');
        console.error('   3. The .dev.vars file is in apps/api/.dev.vars');
        console.error('   4. All R2 credentials are set correctly');
      }
      
      process.exit(1);
    }

    const data = JSON.parse(responseText);
    
    if (!data.success) {
      console.error(`\n❌ API returned error:`);
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Success! R2 configuration is working.\n');
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data?.uploadUrl) {
      console.log('\n📝 Upload URL generated successfully!');
      console.log(`   Upload URL: ${data.data.uploadUrl.substring(0, 80)}...`);
      console.log(`   File Key: ${data.data.media?.fileKey}`);
      console.log(`   Public URL: ${data.data.publicUrl || 'N/A'}`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Your API server is running at', BASE_URL);
    console.error('   2. You have restarted the server after adding .dev.vars');
    process.exit(1);
  }
}

testR2Config();

