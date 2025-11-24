/**
 * Quick Fetch - Test fetching with limits
 * 
 * Use this to test before running the full fetch
 */

import { fetchAllItems } from '../shared/utils/wordpress-explorer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load WordPress credentials
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

async function main() {
  console.log('Quick Test - Fetching sample data...\n');
  
  const auth = await loadWordPressAuth();
  const baseUrl = 'https://studyinkzk.com';
  
  // Test programs endpoint with limit
  console.log('Testing programs endpoint (first 5 pages = ~500 items)...');
  const programs = await fetchAllItems(
    baseUrl,
    'programs',
    {},
    auth,
    { limitPages: 5, perPage: 100 }
  );
  
  console.log(`✓ Fetched ${programs.length} programs`);
  console.log(`Sample program:`, {
    id: programs[0]?.id,
    title: programs[0]?.title?.rendered || programs[0]?.title,
    slug: programs[0]?.slug,
  });
  
  // Estimate total
  if (programs.length === 500) {
    console.log('\n⚠ Reached 5-page limit. Actual total is likely 5000+');
    console.log('Run fetch-all-data.js to fetch everything');
  }
}

main().catch(console.error);

