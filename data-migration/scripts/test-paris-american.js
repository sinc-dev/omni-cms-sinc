/**
 * Test Paris American International University endpoints
 */

import { fetchWordPressData, fetchAllItems } from '../shared/utils/wordpress-explorer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadWordPressAuth() {
  try {
    const envPath = path.join(__dirname, '../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim();
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    return { username, password };
  } catch (error) {
    return null;
  }
}

async function testEndpoint(baseUrl, endpoint, auth, description) {
  console.log(`\n${description}`);
  console.log(`Endpoint: ${endpoint}`);
  
  try {
    const data = await fetchWordPressData(baseUrl, endpoint, { per_page: 5 }, auth);
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✓ Success! Found ${data.length} items`);
      const sample = data[0];
      console.log(`\nSample item:`);
      console.log(`  ID: ${sample.id}`);
      console.log(`  Title: ${sample.title?.rendered || sample.title || 'N/A'}`);
      console.log(`  Slug: ${sample.slug || 'N/A'}`);
      console.log(`  Type: ${sample.type || 'N/A'}`);
      console.log(`  Status: ${sample.status || 'N/A'}`);
      
      return { success: true, endpoint, count: data.length, sample };
    } else if (data && typeof data === 'object') {
      console.log(`✓ Success! Got object response`);
      console.log(`Keys:`, Object.keys(data).join(', '));
      return { success: true, endpoint, data };
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }
  
  return { success: false };
}

async function main() {
  const baseUrl = 'https://parisamerican.com.tr';
  const auth = await loadWordPressAuth();
  
  console.log('Testing Paris American International University');
  console.log('='.repeat(60));
  console.log(`URL: ${baseUrl}`);
  console.log(`Auth: ${auth ? 'Yes' : 'No'}\n`);
  
  // First check post types
  console.log('1. Checking available post types...');
  const typesResult = await testEndpoint(baseUrl, 'wp/v2/types', auth, 'Post Types Registry');
  
  if (typesResult.success && typesResult.data) {
    console.log('\nAvailable Post Types:');
    Object.entries(typesResult.data).forEach(([slug, type]) => {
      console.log(`  - ${slug}: ${type.name}`);
    });
  }
  
  // Test specific endpoints
  const endpoints = [
    { endpoint: 'wp/v2/posts?per_page=5', desc: 'WordPress Blog Posts' },
    { endpoint: 'wp/v2/academic-staff?per_page=5', desc: 'Academic Staff (JetEngine)' },
    { endpoint: 'wp/v2/team-members?per_page=5', desc: 'Team Members (JetEngine)' },
    { endpoint: 'wp/v2/instructors?per_page=5', desc: 'Instructors (JetEngine)' },
    { endpoint: 'wp/v2/programs?per_page=5', desc: 'Programs (JetEngine)' },
  ];
  
  console.log('\n2. Testing specific endpoints...');
  const results = {};
  
  for (const { endpoint, desc } of endpoints) {
    const result = await testEndpoint(baseUrl, endpoint, auth, desc);
    results[endpoint] = result;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log(`\n${'─'.repeat(60)}`);
  console.log('Summary:');
  const working = Object.entries(results).filter(([_, r]) => r.success);
  
  if (working.length > 0) {
    console.log(`\n✓ Working endpoints (${working.length}):`);
    working.forEach(([endpoint, result]) => {
      const count = result.count || 'object';
      console.log(`  - ${endpoint}: ${count} items`);
    });
  } else {
    console.log(`\n✗ No working endpoints found`);
  }
}

main().catch(console.error);

