/**
 * Fetch All Data from WordPress Sites
 * 
 * Comprehensive script to fetch ALL data from WordPress sites
 * Handles large datasets (5000+ items)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWordPressData, fetchAllItems } from '../shared/utils/wordpress-explorer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load WordPress credentials
async function loadWordPressAuth(siteSlug = null) {
  try {
    const envPath = path.join(__dirname, '../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    
    // Site-specific username configuration
    if (siteSlug === 'paris-american-international-university') {
      return {
        username: 'scrape-assist3',
        password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
      };
    }
    
    if (siteSlug === 'study-in-north-cyprus') {
      return {
        username: 'scrape-assist2',
        password: 'X@$T06nzmZM%Xyz%l5p3IHSf'
      };
    }
    
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim() || 'scrape-assist';
    
    if (username && password) {
      return { username, password };
    }
  } catch (error) {
    console.warn('⚠ Could not load WordPress credentials');
  }
  return null;
}

const SITES = [
  {
    name: 'Study In Kazakhstan',
    baseUrl: 'https://studyinkzk.com',
    slug: 'study-in-kazakhstan',
    contentTypes: {
      blogs: 'wp/v2/posts', // WordPress blog posts
      'video-testimonials': 'wp/v2/video-testimonials', // JetEngine
      'team-members': 'wp/v2/team-members', // JetEngine
      reviews: 'wp/v2/reviews', // JetEngine
      programs: 'wp/v2/programs', // JetEngine - 5000+ items!
      'price_lists_hs': 'wp/v2/price_lists_hs', // JetEngine - Country Based Scholarships
      universities: 'wp/v2/universities', // JetEngine
      jobs: 'wp/v2/jobs', // JetEngine
      dormitories: 'wp/v2/dormitories', // JetEngine
      'programs_': 'wp/v2/programs_', // JetEngine - Old Programs
      'universities_': 'wp/v2/universities_', // JetEngine - Old Universities
    },
  },
  {
    name: 'Study in North Cyprus',
    baseUrl: 'https://studyinnc.com',
    slug: 'study-in-north-cyprus',
    contentTypes: {
      blogs: 'wp/v2/posts', // WordPress blog posts
      dormitories: 'wp/v2/dormitories', // JetEngine
      'video-testimonials': 'wp/v2/video-testimonials', // JetEngine
      'team-members': 'wp/v2/team-members', // JetEngine
      reviews: 'wp/v2/reviews', // JetEngine
      programs: 'wp/v2/programs', // JetEngine
      'price_lists_hs': 'wp/v2/price_lists_hs', // JetEngine - Country Based Scholarships
      universities: 'wp/v2/universities', // JetEngine
    },
  },
  {
    name: 'Paris American International University',
    baseUrl: 'https://parisamerican.org',
    slug: 'paris-american-international-university',
    contentTypes: {
      blogs: 'wp/v2/posts', // WordPress blog posts
      'academic-staff': 'wp/v2/academic-staff', // JetEngine
      'team-members': 'wp/v2/team-members', // JetEngine
      instructors: 'wp/v2/instructors', // JetEngine
      programs: 'wp/v2/programs', // JetEngine
    },
  },
];

/**
 * Fetch all items for a content type with progress tracking
 */
async function fetchContentType(
  baseUrl,
  endpoint,
  contentType,
  outputDir,
  auth,
  options = {}
) {
  const { limitPages = null, perPage = 100 } = options;
  
  console.log(`\n  Fetching ${contentType}...`);
  console.log(`  Endpoint: ${endpoint}`);
  if (limitPages) {
    console.log(`  Limited to ${limitPages} pages`);
  }

  let lastProgress = { page: 0, totalItems: 0 };
  
  const items = await fetchAllItems(
    baseUrl,
    endpoint,
    {},
    auth,
    {
      limitPages,
      perPage,
      onProgress: (progress) => {
        // Only log every 10 pages or when total changes significantly
        if (progress.page % 10 === 0 || progress.totalItems - lastProgress.totalItems >= 500) {
          console.log(`    Page ${progress.page}: ${progress.totalItems} items fetched...`);
          lastProgress = progress;
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

  return items;
}


/**
 * Fetch all data for a site
 */
async function fetchSiteData(site, auth = null) {
  // Load auth if not provided, using site-specific username
  if (!auth) {
    auth = await loadWordPressAuth(site.slug);
  }
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Fetching data from: ${site.name}`);
  console.log(`URL: ${site.baseUrl}`);
  console.log('='.repeat(60));

  if (!site.baseUrl) {
    console.log('⚠ Skipping - no baseUrl configured');
    return;
  }

  const outputDir = path.join(__dirname, `../organizations/${site.slug}/raw-data`);
  const results = {
    site: site.name,
    baseUrl: site.baseUrl,
    fetchedAt: new Date().toISOString(),
    contentTypes: {},
  };

  // Fetch each content type
  for (const [contentType, endpoint] of Object.entries(site.contentTypes)) {
    try {
      // For programs on studyinkzk.com, fetch ALL (no limit)
      const limitPages = (site.slug === 'study-in-kazakhstan' && contentType === 'programs') 
        ? null 
        : null; // Fetch all for all types
      
      const items = await fetchContentType(
        site.baseUrl,
        endpoint,
        contentType,
        outputDir,
        auth,
        { limitPages, perPage: 100 }
      );

      results.contentTypes[contentType] = {
        endpoint,
        count: items.length,
        fetched: true,
      };

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ✗ Error fetching ${contentType}:`, error.message);
      results.contentTypes[contentType] = {
        endpoint,
        error: error.message,
        fetched: false,
      };
    }
  }

  // Fetch taxonomies
  console.log(`\n  Fetching taxonomies...`);
  try {
    const categories = await fetchAllItems(site.baseUrl, 'wp/v2/categories', {}, auth, { perPage: 100 });
    const tags = await fetchAllItems(site.baseUrl, 'wp/v2/tags', {}, auth, { perPage: 100 });
    
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
  }

  // Fetch authors
  console.log(`\n  Fetching authors...`);
  try {
    const authors = await fetchAllItems(site.baseUrl, 'wp/v2/users', {}, auth, { perPage: 100 });
    
    await fs.writeFile(
      path.join(outputDir, 'authors.json'),
      JSON.stringify(authors, null, 2)
    );
    console.log(`  ✓ Fetched ${authors.length} authors`);
    
    results.authors = authors.length;
  } catch (error) {
    console.error(`  ✗ Error fetching authors:`, error.message);
  }

  // Save summary
  await fs.writeFile(
    path.join(outputDir, 'fetch-summary.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✓ Completed fetching data from ${site.name}`);
  console.log(`  Total items fetched:`);
  Object.entries(results.contentTypes).forEach(([type, data]) => {
    if (data.fetched) {
      console.log(`    ${type}: ${data.count}`);
    }
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('WordPress Data Fetcher');
  console.log('='.repeat(60));
  console.log('\nThis script will fetch ALL data from WordPress sites.');
  console.log('For studyinkzk.com, this includes 5000+ programs.');
  console.log('\n⚠ This may take a while...');
  console.log('='.repeat(60));

  // WordPress credentials will be loaded per-site (to use different usernames)
  console.log('\n✓ WordPress credentials will be loaded per-site');

  const startTime = Date.now();

  for (const site of SITES) {
    try {
      // fetchSiteData will load auth per-site (to use scrape-assist2 for Paris American)
      await fetchSiteData(site);
      
      // Delay between sites to avoid rate limiting
      if (site !== SITES[SITES.length - 1]) {
        console.log('\nWaiting 5 seconds before next site...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(`\n✗ Fatal error fetching ${site.name}:`, error.message);
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  console.log(`\n${'='.repeat(60)}`);
  console.log('✓ All data fetching complete!');
  console.log(`⏱ Duration: ${duration} minutes`);
  console.log('='.repeat(60));
  console.log('\nData saved to:');
  SITES.forEach(site => {
    if (site.baseUrl) {
      console.log(`  - organizations/${site.slug}/raw-data/`);
    }
  });
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});

