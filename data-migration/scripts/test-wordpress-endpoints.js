/**
 * Test WordPress REST API endpoints
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

async function testEndpoint(baseUrl, endpoint, auth) {
  console.log(`\nTesting: ${endpoint}`);
  try {
    const data = await fetchWordPressData(baseUrl, endpoint, {}, auth);
    if (data) {
      console.log(`  ✓ Success: ${Array.isArray(data) ? data.length + ' items' : 'Object received'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`  Sample:`, JSON.stringify(data[0], null, 2).substring(0, 200));
      }
      return true;
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
  }
  return false;
}

async function main() {
  const baseUrl = 'https://studyinkzk.com';
  const auth = await loadWordPressAuth();
  
  console.log('Testing WordPress REST API endpoints...');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Auth: ${auth ? 'Yes' : 'No'}`);
  
  // Test root endpoint
  console.log('\n=== Testing Root Endpoint ===');
  try {
    const response = await fetch(`${baseUrl}/wp-json/`);
    const root = await response.json();
    console.log('Available namespaces:', Object.keys(root));
    if (root.routes) {
      console.log('\nAvailable routes (first 20):');
      Object.keys(root.routes).slice(0, 20).forEach(route => {
        console.log(`  ${route}`);
      });
    }
  } catch (error) {
    console.log('Error fetching root:', error.message);
  }
  
  // Test standard endpoints
  const endpoints = [
    '',
    'wp/v2',
    'wp/v2/posts',
    'wp/v2/posts?per_page=1',
    'wp/v2/types',
    'wp/v2/programs',
    'wp/v2/programs?per_page=1',
    'wp/v2/universities',
    'wp/v2/universities?per_page=1',
    'wp/v2/team-members',
    'wp/v2/team-members?per_page=1',
  ];
  
  console.log('\n=== Testing Specific Endpoints ===');
  for (const endpoint of endpoints) {
    await testEndpoint(baseUrl, endpoint, auth);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
}

main().catch(console.error);

