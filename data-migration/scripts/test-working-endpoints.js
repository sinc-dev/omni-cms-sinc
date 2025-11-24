/**
 * Test Working WordPress Endpoints
 * 
 * Test endpoints that showed success in previous tests
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
      console.log(`  Date: ${sample.date || sample.created_at || 'N/A'}`);
      console.log(`  Keys:`, Object.keys(sample).slice(0, 15).join(', '));
      
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
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com', slug: 'study-in-kazakhstan' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com', slug: 'study-in-north-cyprus' },
  ];
  
  const auth = await loadWordPressAuth();
  
  console.log('Testing Working WordPress Endpoints');
  console.log('='.repeat(60));
  console.log(`Auth: ${auth ? 'Yes' : 'No'}\n`);
  
  // Test endpoints that showed success
  const endpoints = [
    { endpoint: 'wp/v2/posts?per_page=5&status=any', desc: 'WordPress Posts (any status)' },
    { endpoint: 'wp/v2/posts?per_page=5', desc: 'WordPress Posts' },
    { endpoint: 'wp/v2/pages?per_page=5', desc: 'WordPress Pages' },
    { endpoint: 'wp/v2/types', desc: 'Post Types Registry' },
    { endpoint: 'wp/v2/categories', desc: 'Categories' },
    { endpoint: 'wp/v2/tags', desc: 'Tags' },
    { endpoint: 'wp/v2/programs?per_page=5', desc: 'Programs (JetEngine)' },
    { endpoint: 'wp/v2/universities?per_page=5', desc: 'Universities (JetEngine)' },
    { endpoint: 'wp/v2/team-members?per_page=5', desc: 'Team Members (JetEngine)' },
  ];
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log('='.repeat(60));
    
    const results = {};
    
    for (const { endpoint, desc } of endpoints) {
      const result = await testEndpoint(site.baseUrl, endpoint, auth, desc);
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
        console.log(`  - ${endpoint}`);
        console.log(`    Count: ${count} items`);
        if (result.sample) {
          console.log(`    Post Type: ${result.sample.type || 'N/A'}`);
        }
      });
      
      // If wp/v2/types works, show all post types
      if (results['wp/v2/types']?.success) {
        console.log(`\n📋 Available Post Types:`);
        const types = results['wp/v2/types'].data;
        if (types && typeof types === 'object') {
          Object.entries(types).forEach(([slug, type]) => {
            console.log(`  - ${slug}: ${type.name}`);
            console.log(`    REST Base: ${type.rest_base || slug}`);
          });
        }
      }
    } else {
      console.log(`\n✗ No working endpoints found`);
    }
  }
}

main().catch(console.error);

