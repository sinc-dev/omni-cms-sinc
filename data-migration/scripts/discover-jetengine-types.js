/**
 * Discover JetEngine Custom Post Types
 * 
 * JetEngine is a WordPress plugin that creates custom post types.
 * This script discovers how they're exposed in the REST API.
 */

import { fetchWordPressData } from '../shared/utils/wordpress-explorer.js';
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

async function discoverPostTypes(baseUrl, auth) {
  console.log('\n=== Discovering Post Types ===\n');
  
  // Method 1: Try wp/v2/types endpoint
  console.log('1. Checking wp/v2/types...');
  try {
    const types = await fetchWordPressData(baseUrl, 'wp/v2/types', {}, auth);
    if (types && typeof types === 'object') {
      console.log('   ✓ Found post types:', Object.keys(types));
      console.log('\n   Post Type Details:');
      Object.entries(types).forEach(([slug, type]) => {
        console.log(`   - ${slug}:`);
        console.log(`     Name: ${type.name}`);
        console.log(`     REST Base: ${type.rest_base || slug}`);
        console.log(`     REST Namespace: ${type.rest_namespace || 'wp/v2'}`);
        if (type.supports) {
          console.log(`     Supports: ${Object.keys(type.supports).join(', ')}`);
        }
      });
      return types;
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  // Method 2: Try JetEngine-specific endpoints
  console.log('\n2. Checking JetEngine-specific endpoints...');
  const jetEngineEndpoints = [
    'jet-engine/v1',
    'jet-engine/v1/types',
    'jet-engine/v1/post-types',
    'jet/v1/types',
    'jet/v1/post-types',
  ];
  
  for (const endpoint of jetEngineEndpoints) {
    try {
      const data = await fetchWordPressData(baseUrl, endpoint, {}, auth);
      if (data) {
        console.log(`   ✓ Found data at ${endpoint}`);
        console.log('   Data:', JSON.stringify(data, null, 2).substring(0, 500));
        return data;
      }
    } catch (error) {
      // Continue to next endpoint
    }
  }
  
  // Method 3: Try common JetEngine post type slugs directly
  console.log('\n3. Testing common JetEngine post type endpoints...');
  const commonTypes = [
    'programs',
    'universities',
    'team-members',
    'academic-staff',
    'courses',
    'program',
    'university',
    'team-member',
  ];
  
  const foundTypes = [];
  
  for (const typeSlug of commonTypes) {
    // Try different namespace patterns
    const endpoints = [
      `wp/v2/${typeSlug}`,
      `wp/v2/${typeSlug}?per_page=1`,
      `jet-engine/v1/${typeSlug}`,
      `jet/v1/${typeSlug}`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        const data = await fetchWordPressData(baseUrl, endpoint, {}, auth);
        if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
          console.log(`   ✓ Found: ${endpoint}`);
          foundTypes.push({ slug: typeSlug, endpoint, sample: Array.isArray(data) ? data[0] : data });
          break; // Found it, move to next type
        }
      } catch (error) {
        // Continue
      }
    }
  }
  
  if (foundTypes.length > 0) {
    console.log('\n   Found Post Types:');
    foundTypes.forEach(({ slug, endpoint, sample }) => {
      console.log(`   - ${slug} (${endpoint})`);
      if (sample) {
        console.log(`     Sample fields:`, Object.keys(sample).slice(0, 10).join(', '));
      }
    });
    return foundTypes;
  }
  
  // Method 4: Try root REST API to see all available routes
  console.log('\n4. Checking root REST API for all routes...');
  try {
    const response = await fetch(`${baseUrl}/wp-json/`, {
      headers: auth ? {
        'Authorization': `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
      } : {}
    });
    
    if (response.ok) {
      const root = await response.json();
      console.log('   Available namespaces:', Object.keys(root));
      
      if (root.routes) {
        console.log('\n   All available routes (filtered for post types):');
        const postTypeRoutes = Object.keys(root.routes).filter(route => 
          route.includes('program') || 
          route.includes('university') || 
          route.includes('team') ||
          route.includes('/v2/') ||
          route.includes('jet')
        );
        postTypeRoutes.slice(0, 30).forEach(route => {
          console.log(`     ${route}`);
        });
      }
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }
  
  return null;
}

async function testFetching(baseUrl, postTypeSlug, auth) {
  console.log(`\n=== Testing Fetching: ${postTypeSlug} ===\n`);
  
  // Try different endpoint patterns
  const endpoints = [
    `wp/v2/${postTypeSlug}`,
    `wp/v2/${postTypeSlug}?per_page=10`,
    `jet-engine/v1/${postTypeSlug}`,
    `jet/v1/${postTypeSlug}`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying: ${endpoint}...`);
      const data = await fetchWordPressData(baseUrl, endpoint, { per_page: 5 }, auth);
      
      if (data && Array.isArray(data) && data.length > 0) {
        console.log(`✓ Success! Found ${data.length} items`);
        console.log('\nSample item structure:');
        console.log(JSON.stringify(data[0], null, 2).substring(0, 1000));
        return { endpoint, data };
      } else if (data && typeof data === 'object') {
        console.log(`✓ Success! Got object response`);
        console.log('Keys:', Object.keys(data));
        return { endpoint, data };
      }
    } catch (error) {
      console.log(`  ✗ ${error.message}`);
    }
  }
  
  return null;
}

async function main() {
  const sites = [
    { name: 'Study In Kazakhstan', baseUrl: 'https://studyinkzk.com', slug: 'study-in-kazakhstan' },
    { name: 'Study in North Cyprus', baseUrl: 'https://studyinnc.com', slug: 'study-in-north-cyprus' },
  ];
  
  const auth = await loadWordPressAuth();
  console.log('JetEngine Post Type Discovery');
  console.log('='.repeat(60));
  console.log(`Auth: ${auth ? 'Yes' : 'No'}\n`);
  
  for (const site of sites) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Site: ${site.name}`);
    console.log(`URL: ${site.baseUrl}`);
    console.log('='.repeat(60));
    
    const postTypes = await discoverPostTypes(site.baseUrl, auth);
    
    // If we found post types, test fetching from them
    if (postTypes) {
      if (typeof postTypes === 'object' && !Array.isArray(postTypes)) {
        // It's a types object, test fetching from each
        const typeSlugs = Object.keys(postTypes);
        for (const slug of typeSlugs.slice(0, 3)) { // Test first 3
          await testFetching(site.baseUrl, slug, auth);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        }
      }
    }
    
    // Also test common JetEngine post types
    console.log('\n=== Testing Common JetEngine Types ===');
    const commonTypes = ['programs', 'universities', 'team-members'];
    for (const type of commonTypes) {
      const result = await testFetching(site.baseUrl, type, auth);
      if (result) {
        console.log(`\n✓ Successfully found ${type} at: ${result.endpoint}`);
        break; // Found working endpoint
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Discovery complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

