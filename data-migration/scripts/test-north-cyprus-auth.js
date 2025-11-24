/**
 * Test Study in North Cyprus Authentication
 * 
 * Tests different authentication scenarios to diagnose the HTTP 400 error
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://studyinnc.com';
const ENDPOINT = 'wp/v2/posts';

// Test credentials
const CREDENTIALS_TO_TEST = [
  {
    name: 'scrape-assist2 (North Cyprus)',
    username: 'scrape-assist2',
    password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
  },
  {
    name: 'scrape-assist (default)',
    username: 'scrape-assist',
    password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
  },
  {
    name: 'scrape-assist3 (Paris American)',
    username: 'scrape-assist3',
    password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
  },
  {
    name: 'No authentication',
    username: null,
    password: null
  }
];

async function testAuth(credentials) {
  const url = new URL(`${BASE_URL}/wp-json/${ENDPOINT}`);
  url.searchParams.set('per_page', '1');
  
  const headers = {};
  
  if (credentials.username && credentials.password) {
    const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
  }
  
  console.log(`\nTesting: ${credentials.name}`);
  console.log(`  URL: ${url.toString()}`);
  if (credentials.username) {
    console.log(`  Username: ${credentials.username}`);
  } else {
    console.log(`  No authentication`);
  }
  
  try {
    const response = await fetch(url.toString(), { headers });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Try to get response body
    const contentType = response.headers.get('content-type');
    let body;
    
    if (contentType && contentType.includes('application/json')) {
      body = await response.json();
      console.log(`  Response Body:`, JSON.stringify(body, null, 2));
    } else {
      body = await response.text();
      console.log(`  Response Body (text):`, body.substring(0, 500));
    }
    
    if (response.ok) {
      console.log(`  ✅ SUCCESS - Authentication works!`);
      return { success: true, credentials };
    } else {
      console.log(`  ❌ FAILED - ${response.status} ${response.statusText}`);
      return { success: false, status: response.status, body };
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Testing Study in North Cyprus Authentication');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  
  const results = [];
  
  for (const creds of CREDENTIALS_TO_TEST) {
    const result = await testAuth(creds);
    results.push({ ...result, credentials: creds });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  
  const successful = results.find(r => r.success);
  if (successful) {
    console.log(`✅ Found working credentials: ${successful.credentials.name}`);
    console.log(`   Username: ${successful.credentials.username}`);
  } else {
    console.log(`❌ No working credentials found`);
    console.log(`\nAll tests returned errors. Check the detailed output above.`);
  }
  
  // Check if it's an authentication issue (401) vs bad request (400)
  const has401 = results.some(r => r.status === 401);
  const has400 = results.some(r => r.status === 400);
  
  if (has401) {
    console.log(`\n⚠️  Got 401 Unauthorized - This suggests authentication is required but credentials are wrong`);
  }
  if (has400) {
    console.log(`\n⚠️  Got 400 Bad Request - This might be:`);
    console.log(`   - Wrong credentials (but server returns 400 instead of 401)`);
    console.log(`   - API endpoint not available`);
    console.log(`   - Security plugin blocking the request`);
    console.log(`   - Different WordPress configuration`);
  }
}

main().catch(console.error);

