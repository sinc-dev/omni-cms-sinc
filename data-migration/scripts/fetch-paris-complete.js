/**
 * Fetch ALL data from Paris American International University
 * Using scrape-assist3 credentials
 */

import { fetchWordPressData, fetchAllItems } from '../shared/utils/wordpress-explorer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auth = {
  username: 'scrape-assist3',
  password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
};

async function fetchContentType(baseUrl, endpoint, contentType, outputDir, auth) {
  console.log(`\n  Fetching ${contentType}...`);
  console.log(`  Endpoint: ${endpoint}`);
  
  try {
    const items = await fetchAllItems(
      baseUrl,
      endpoint,
      {},
      auth,
      {
        perPage: 100,
        onProgress: (progress) => {
          if (progress.page % 10 === 0 || progress.totalItems % 1000 === 0) {
            console.log(`    Page ${progress.page}: ${progress.totalItems} items fetched...`);
          }
        },
      }
    );
    
    console.log(`  ✓ Fetched ${items.length} ${contentType}`);
    
    // Save raw JSON
    const outputFile = path.join(outputDir, contentType, 'raw.json');
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, JSON.stringify(items, null, 2));
    console.log(`  ✓ Saved to ${outputFile}`);
    
    return { success: true, count: items.length };
  } catch (error) {
    console.log(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const baseUrl = 'https://parisamerican.org';
  const slug = 'paris-american-international-university';
  
  console.log('='.repeat(60));
  console.log('Fetching ALL data from: Paris American International University');
  console.log(`URL: ${baseUrl}`);
  console.log(`Username: ${auth.username}`);
  console.log('='.repeat(60));
  
  const outputDir = path.join(__dirname, `../organizations/${slug}/raw-data`);
  const results = {
    site: 'Paris American International University',
    baseUrl,
    username: auth.username,
    fetchedAt: new Date().toISOString(),
    contentTypes: {},
  };
  
  // Fetch each content type
  const contentTypes = {
    blogs: 'wp/v2/posts',
    'academic-staff': 'wp/v2/academic-staff',
    'team-members': 'wp/v2/team-members',
    instructors: 'wp/v2/instructors',
    programs: 'wp/v2/programs',
  };
  
  for (const [key, endpoint] of Object.entries(contentTypes)) {
    const result = await fetchContentType(baseUrl, endpoint, key, outputDir, auth);
    results.contentTypes[key] = {
      endpoint,
      count: result.count || 0,
      fetched: result.success,
      error: result.error,
    };
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  // Fetch taxonomies
  console.log(`\n  Fetching taxonomies...`);
  try {
    const categories = await fetchAllItems(baseUrl, 'wp/v2/categories', {}, auth, { perPage: 100 });
    const tags = await fetchAllItems(baseUrl, 'wp/v2/tags', {}, auth, { perPage: 100 });
    
    await fs.writeFile(
      path.join(outputDir, 'taxonomies.json'),
      JSON.stringify({ categories, tags }, null, 2)
    );
    console.log(`  ✓ Fetched ${categories.length} categories and ${tags.length} tags`);
    
    results.taxonomies = {
      categories: categories.length,
      tags: tags.length,
    };
  } catch (error) {
    console.error(`  ✗ Error fetching taxonomies:`, error.message);
    results.taxonomies = { error: error.message };
  }
  
  // Fetch authors
  console.log(`\n  Fetching authors...`);
  try {
    const authors = await fetchAllItems(baseUrl, 'wp/v2/users', {}, auth, { perPage: 100 });
    
    await fs.writeFile(
      path.join(outputDir, 'authors.json'),
      JSON.stringify(authors, null, 2)
    );
    console.log(`  ✓ Fetched ${authors.length} authors`);
    
    results.authors = authors.length;
  } catch (error) {
    console.error(`  ✗ Error fetching authors:`, error.message);
    results.authors = { error: error.message };
  }
  
  // Save summary
  await fs.writeFile(
    path.join(outputDir, 'fetch-summary.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✓ Completed fetching data from Paris American International University');
  console.log(`  Username used: ${auth.username}`);
  console.log(`\n  Total items fetched:`);
  Object.entries(results.contentTypes).forEach(([type, data]) => {
    if (data.fetched) {
      console.log(`    ${type}: ${data.count}`);
    } else {
      console.log(`    ${type}: Failed (${data.error || 'Unknown error'})`);
    }
  });
  if (results.taxonomies && !results.taxonomies.error) {
    console.log(`    categories: ${results.taxonomies.categories}`);
    console.log(`    tags: ${results.taxonomies.tags}`);
  }
  if (results.authors && typeof results.authors === 'number') {
    console.log(`    authors: ${results.authors}`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);

