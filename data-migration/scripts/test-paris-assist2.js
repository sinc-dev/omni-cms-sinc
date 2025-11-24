/**
 * Test Paris American with scrape-assist2 username
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
    // Use scrape-assist2 as username, keep same password
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    return { username: 'scrape-assist2', password };
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
      console.log(`Keys:`, Object.keys(data).slice(0, 20).join(', '));
      return { success: true, endpoint, data };
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
  }
  
  return { success: false };
}

async function main() {
  const baseUrl = 'https://parisamerican.org';
  const auth = await loadWordPressAuth();
  
  console.log('Testing Paris American International University');
  console.log('='.repeat(60));
  console.log(`URL: ${baseUrl}`);
  console.log(`Username: ${auth?.username || 'N/A'}`);
  console.log(`Password: ${auth?.password ? '***' : 'N/A'}\n`);
  
  if (!auth) {
    console.log('✗ Could not load credentials');
    return;
  }
  
  // Test endpoints
  const endpoints = [
    { endpoint: 'wp/v2/posts?per_page=5', desc: 'WordPress Blog Posts' },
    { endpoint: 'wp/v2/academic-staff?per_page=5', desc: 'Academic Staff (JetEngine)' },
    { endpoint: 'wp/v2/team-members?per_page=5', desc: 'Team Members (JetEngine)' },
    { endpoint: 'wp/v2/instructors?per_page=5', desc: 'Instructors (JetEngine)' },
    { endpoint: 'wp/v2/programs?per_page=5', desc: 'Programs (JetEngine)' },
    { endpoint: 'wp/v2/types', desc: 'Post Types Registry' },
    { endpoint: 'wp/v2/categories', desc: 'Categories' },
    { endpoint: 'wp/v2/tags', desc: 'Tags' },
    { endpoint: 'wp/v2/users', desc: 'Users/Authors' },
  ];
  
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
  
  // If we found working endpoints, try fetching all data
  if (working.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Fetching all data from working endpoints...');
    
    const fetchEndpoints = [
      { key: 'blogs', endpoint: 'wp/v2/posts' },
      { key: 'academic-staff', endpoint: 'wp/v2/academic-staff' },
      { key: 'team-members', endpoint: 'wp/v2/team-members' },
      { key: 'instructors', endpoint: 'wp/v2/instructors' },
      { key: 'programs', endpoint: 'wp/v2/programs' },
    ];
    
    for (const { key, endpoint } of fetchEndpoints) {
      if (results[`${endpoint}?per_page=5`]?.success || results[endpoint]?.success) {
        console.log(`\nFetching all ${key}...`);
        try {
          const allItems = await fetchAllItems(baseUrl, endpoint, {}, auth, { perPage: 100 });
          console.log(`  ✓ Fetched ${allItems.length} ${key}`);
          
          // Save to file
          const outputDir = path.join(__dirname, `../organizations/paris-american-international-university/raw-data/${key}`);
          await fs.mkdir(outputDir, { recursive: true });
          await fs.writeFile(
            path.join(outputDir, 'raw.json'),
            JSON.stringify(allItems, null, 2)
          );
          console.log(`  ✓ Saved to ${outputDir}/raw.json`);
        } catch (error) {
          console.log(`  ✗ Error: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}

main().catch(console.error);

