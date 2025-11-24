/**
 * Analyze Sample Data
 * 
 * Fetches and analyzes sample data from WordPress sites
 * to understand relationships, dates, and structure
 */

import { fetchWordPressData, fetchAllItems } from '../shared/utils/wordpress-explorer.js';
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
    
    if (username && password) {
      return { username, password };
    }
  } catch (error) {
    console.warn('⚠ Could not load WordPress credentials from .env.wordpress-auth');
  }
  return null;
}

const SITES = [
  {
    name: 'Study In Kazakhstan',
    baseUrl: 'https://studyinkzk.com',
    slug: 'study-in-kazakhstan',
  },
  {
    name: 'Study in North Cyprus',
    baseUrl: 'https://studyinnc.com',
    slug: 'study-in-north-cyprus',
  },
];

/**
 * Analyze dates in posts
 */
function analyzeDates(posts) {
  const dateFields = new Set();
  const datePatterns = {};

  posts.forEach(post => {
    Object.keys(post).forEach(key => {
      if (key.includes('date') || key.includes('Date')) {
        dateFields.add(key);
        if (!datePatterns[key]) {
          datePatterns[key] = {
            sample: post[key],
            format: post[key] ? new Date(post[key]).toISOString() : null,
          };
        }
      }
    });
  });

  return {
    fields: Array.from(dateFields),
    patterns: datePatterns,
  };
}

/**
 * Analyze relationships
 */
function analyzeRelationships(posts) {
  const relationships = {
    categories: new Set(),
    tags: new Set(),
    authors: new Set(),
    featuredMedia: new Set(),
    customFields: {},
  };

  posts.forEach(post => {
    // Categories
    if (post.categories && Array.isArray(post.categories)) {
      post.categories.forEach(catId => relationships.categories.add(catId));
    }

    // Tags
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tagId => relationships.tags.add(tagId));
    }

    // Author
    if (post.author) {
      relationships.authors.add(post.author);
    }

    // Featured Media
    if (post.featured_media) {
      relationships.featuredMedia.add(post.featured_media);
    }

    // Custom fields (ACF or other)
    Object.keys(post).forEach(key => {
      if (key.startsWith('acf_') || key.startsWith('custom_') || key.includes('_field')) {
        if (!relationships.customFields[key]) {
          relationships.customFields[key] = {
            type: typeof post[key],
            sample: post[key],
          };
        }
      }
    });
  });

  return {
    categories: Array.from(relationships.categories),
    tags: Array.from(relationships.tags),
    authors: Array.from(relationships.authors),
    featuredMedia: Array.from(relationships.featuredMedia),
    customFields: relationships.customFields,
  };
}

/**
 * Analyze post structure in detail
 */
function analyzePostStructure(posts) {
  if (posts.length === 0) return null;

  const samplePost = posts[0];
  const structure = {
    allFields: Object.keys(samplePost),
    fieldTypes: {},
    nestedObjects: {},
    arrays: {},
  };

  // Analyze each field
  Object.entries(samplePost).forEach(([key, value]) => {
    const type = typeof value;
    structure.fieldTypes[key] = {
      type,
      isArray: Array.isArray(value),
      isNull: value === null,
      isObject: type === 'object' && value !== null && !Array.isArray(value),
    };

    if (Array.isArray(value)) {
      structure.arrays[key] = {
        length: value.length,
        sample: value.slice(0, 3),
        itemType: value.length > 0 ? typeof value[0] : 'unknown',
      };
    } else if (type === 'object' && value !== null) {
      structure.nestedObjects[key] = {
        keys: Object.keys(value),
        sample: Object.fromEntries(
          Object.entries(value).slice(0, 5).map(([k, v]) => [
            k,
            typeof v === 'object' ? '[object]' : String(v).substring(0, 50),
          ])
        ),
      };
    }
  });

  return structure;
}

/**
 * Analyze a specific site
 */
async function analyzeSite(site, auth = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Analyzing: ${site.name}`);
  console.log('='.repeat(60));

  const analysis = {
    site: site.name,
    baseUrl: site.baseUrl,
    analyzedAt: new Date().toISOString(),
    posts: {},
    categories: {},
    tags: {},
    authors: {},
    customPostTypes: {},
  };

  // Analyze standard posts
  console.log('\n1. Fetching sample posts...');
  const posts = await fetchAllItems(site.baseUrl, 'posts', { per_page: 10 }, auth);
  if (posts && posts.length > 0) {
    analysis.posts = {
      count: posts.length,
      structure: analyzePostStructure(posts),
      dates: analyzeDates(posts),
      relationships: analyzeRelationships(posts),
      sample: posts.slice(0, 2), // Keep 2 samples for reference
    };
    console.log(`✓ Analyzed ${posts.length} posts`);
  }

  // Analyze categories with details
  console.log('\n2. Fetching categories...');
  const categories = await fetchAllItems(site.baseUrl, 'categories', {}, auth);
  if (categories && categories.length > 0) {
    analysis.categories = {
      count: categories.length,
      structure: analyzePostStructure(categories),
      sample: categories.slice(0, 5),
    };
    console.log(`✓ Found ${categories.length} categories`);
  }

  // Analyze tags with details
  console.log('\n3. Fetching tags...');
  const tags = await fetchAllItems(site.baseUrl, 'tags', {}, auth);
  if (tags && tags.length > 0) {
    analysis.tags = {
      count: tags.length,
      structure: analyzePostStructure(tags),
      sample: tags.slice(0, 5),
    };
    console.log(`✓ Found ${tags.length} tags`);
  }

  // Analyze authors with details
  console.log('\n4. Fetching authors...');
  const authors = await fetchAllItems(site.baseUrl, 'users', {}, auth);
  if (authors && authors.length > 0) {
    analysis.authors = {
      count: authors.length,
      structure: analyzePostStructure(authors),
      sample: authors.slice(0, 3),
    };
    console.log(`✓ Found ${authors.length} authors`);
  }

  // Try custom post types
  const customTypes = ['team-members', 'universities', 'programs', 'academic-staff'];
  for (const postType of customTypes) {
    console.log(`\n5. Checking ${postType}...`);
    const items = await fetchWordPressData(site.baseUrl, postType, { per_page: 5 }, auth);
    if (items && items.length > 0) {
      analysis.customPostTypes[postType] = {
        count: items.length,
        structure: analyzePostStructure(items),
        dates: analyzeDates(items),
        relationships: analyzeRelationships(items),
        sample: items.slice(0, 2),
      };
      console.log(`✓ Found ${items.length} ${postType}`);
    }
  }

  return analysis;
}

async function main() {
  console.log('WordPress Sample Data Analyzer');
  console.log('='.repeat(60));
  console.log('This script fetches sample data and analyzes:');
  console.log('  - Field structure and types');
  console.log('  - Date fields (created, updated, published)');
  console.log('  - Relationships (categories, tags, authors, media)');
  console.log('  - Custom fields');
  console.log('  - Nested objects and arrays');
  console.log('='.repeat(60));

  // Load WordPress authentication
  const auth = await loadWordPressAuth();
  if (auth) {
    console.log('\n✓ WordPress credentials loaded');
  }

  const results = [];

  for (const site of SITES) {
    if (!site.baseUrl) {
      console.log(`\n⚠ Skipping ${site.name} - no baseUrl configured`);
      continue;
    }

    try {
      const analysis = await analyzeSite(site, auth);
      results.push(analysis);

      // Save detailed analysis
      const outputPath = path.join(
        __dirname,
        `../organizations/${site.slug}/detailed-analysis.json`
      );
      await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
      console.log(`\n✓ Detailed analysis saved to: ${outputPath}`);
    } catch (error) {
      console.error(`\n✗ Error analyzing ${site.name}:`, error.message);
    }
  }

  // Save combined results
  const combinedPath = path.join(__dirname, '../wordpress-detailed-analysis.json');
  await fs.writeFile(combinedPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Combined analysis saved to: ${combinedPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS SUMMARY');
  console.log('='.repeat(60));
  results.forEach(result => {
    console.log(`\n${result.site}:`);
    console.log(`  Posts analyzed: ${result.posts?.count || 0}`);
    console.log(`  Categories: ${result.categories?.count || 0}`);
    console.log(`  Tags: ${result.tags?.count || 0}`);
    console.log(`  Authors: ${result.authors?.count || 0}`);
    console.log(`  Custom post types: ${Object.keys(result.customPostTypes || {}).length}`);
    if (result.posts?.dates) {
      console.log(`  Date fields: ${result.posts.dates.fields.join(', ')}`);
    }
  });
  console.log('\n✓ Analysis complete!');
}

main().catch(console.error);

