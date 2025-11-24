/**
 * Test Default WordPress REST API Endpoints
 * 
 * Xecurify security plugin blocks custom endpoints but may allow default ones
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
    // Try with auth first
    const data = await fetchWordPressData(baseUrl, endpoint, { per_page: 5 }, auth);
    
    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✓ Success! Found ${data.length} items`);
      console.log(`Sample item keys:`, Object.keys(data[0]).slice(0, 15).join(', '));
      
      // Show sample
      const sample = data[0];
      console.log('\nSample item:');
      console.log(`  ID: ${sample.id}`);
      console.log(`  Title: ${sample.title?.rendered || sample.title || 'N/A'}`);
      console.log(`  Slug: ${sample.slug || 'N/A'}`);
      console.log(`  Type: ${sample.type || 'N/A'}`);
      console.log(`  Status: ${sample.status || 'N/A'}`);
      console.log(`  Date: ${sample.date || sample.created_at || 'N/A'}`);
      
      return { success: true, endpoint, data };
    } else if (data && typeof data === 'object') {
      console.log(`✓ Success! Got object response`);
      console.log(`Keys:`, Object.keys(data).join(', '));
      return { success: true, endpoint, data };
    } else {
      console.log(`⚠ Got empty response`);
      return { success: false, endpoint };
    }
  } catch (error) {
    console.log(`✗ Error: ${error.message}`);
    return { success: false, endpoint, error: error.message };
  }
}

async function main() {
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com', slug: 'study-in-kazakhstan' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com', slug: 'study-in-north-cyprus' },
  ];
  
  const auth = await loadWordPressAuth();
  
  console.log('Testing Default WordPress REST API Endpoints');
  console.log('='.repeat(60));
  console.log(`Auth: ${auth ? 'Yes' : 'No'}\n`);
  
  // Default WordPress endpoints that might work
  const defaultEndpoints = [
    { endpoint: 'wp/v2/posts', desc: 'Standard WordPress Posts' },
    { endpoint: 'wp/v2/pages', desc: 'WordPress Pages' },
    { endpoint: 'wp/v2/categories', desc: 'Categories' },
    { endpoint: 'wp/v2/tags', desc: 'Tags' },
    { endpoint: 'wp/v2/users', desc: 'Users/Authors' },
    { endpoint: 'wp/v2/media', desc: 'Media Library' },
    { endpoint: 'wp/v2/types', desc: 'Post Types Registry' },
  ];
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log(`URL: ${site.baseUrl}`);
    console.log('='.repeat(60));
    
    const results = {};
    
    // Test default endpoints
    for (const { endpoint, desc } of defaultEndpoints) {
      const result = await testEndpoint(site.baseUrl, endpoint, auth, desc);
      results[endpoint] = result;
      
      // If we found posts, check if they're JetEngine posts
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const sample = result.data[0];
        if (sample.type && sample.type !== 'post' && sample.type !== 'page') {
          console.log(`\n  ⚠ Found custom post type: ${sample.type}`);
          console.log(`  This might be a JetEngine post type!`);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }
    
    // Summary
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Summary:');
    const working = Object.entries(results).filter(([_, r]) => r.success);
    const failed = Object.entries(results).filter(([_, r]) => !r.success);
    
    console.log(`\n✓ Working endpoints (${working.length}):`);
    working.forEach(([endpoint, result]) => {
      const count = Array.isArray(result.data) ? result.data.length : 'object';
      console.log(`  - ${endpoint} (${count} items)`);
    });
    
    if (failed.length > 0) {
      console.log(`\n✗ Failed endpoints (${failed.length}):`);
      failed.forEach(([endpoint]) => {
        console.log(`  - ${endpoint}`);
      });
    }
    
    // If wp/v2/types works, show all available post types
    if (results['wp/v2/types']?.success && results['wp/v2/types'].data) {
      console.log(`\n📋 Available Post Types:`);
      const types = results['wp/v2/types'].data;
      Object.entries(types).forEach(([slug, type]) => {
        console.log(`  - ${slug}: ${type.name}`);
        console.log(`    REST Base: ${type.rest_base || slug}`);
        if (type.supports) {
          console.log(`    Supports: ${Object.keys(type.supports).slice(0, 5).join(', ')}`);
        }
      });
    }
    
    // If wp/v2/posts works, try fetching all posts to see post types
    if (results['wp/v2/posts']?.success) {
      console.log(`\n📝 Checking post types in posts...`);
      try {
        const allPosts = await fetchAllItems(
          site.baseUrl,
          'wp/v2/posts',
          {},
          auth,
          { limitPages: 3, perPage: 100 }
        );
        
        const postTypes = new Set();
        allPosts.forEach(post => {
          if (post.type) postTypes.add(post.type);
        });
        
        console.log(`  Found post types: ${Array.from(postTypes).join(', ')}`);
        
        if (postTypes.size > 0 && !postTypes.has('post')) {
          console.log(`  ⚠ These are custom post types!`);
        }
      } catch (error) {
        console.log(`  Error fetching all posts: ${error.message}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

