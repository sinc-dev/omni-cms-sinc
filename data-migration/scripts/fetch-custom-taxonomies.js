/**
 * Fetch Custom Taxonomy Terms from WordPress Sites
 * 
 * Fetches terms for custom taxonomies that aren't standard WordPress taxonomies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAllItems } from '../shared/utils/wordpress-explorer.js';

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
    customTaxonomies: [
      'program-degree-level',
      'program-languages',
      'program_durations',
      'program_study_formats',
      'disciplines',
      'location',
    ],
  },
  {
    name: 'Study in North Cyprus',
    baseUrl: 'https://studyinnc.com',
    slug: 'study-in-north-cyprus',
    customTaxonomies: [
      'program-degree-level',
      'program-languages',
      'program_durations',
      'program_study_formats',
      'disciplines',
      'location',
      'dormitory-category',
      'price-format',
      'currency',
      'room-type',
      'institution--residence-name',
    ],
  },
  {
    name: 'Paris American International University',
    baseUrl: 'https://parisamerican.org',
    slug: 'paris-american-international-university',
    customTaxonomies: [
      'degree-levels',
      'languages',
      'durations',
      'disciplines',
    ],
  },
];

/**
 * Fetch all terms for a custom taxonomy
 */
async function fetchTaxonomyTerms(baseUrl, taxonomySlug, auth) {
  try {
    const endpoint = `wp/v2/${taxonomySlug}`;
    console.log(`    Fetching ${taxonomySlug}...`);
    
    const terms = await fetchAllItems(baseUrl, endpoint, {}, auth, { perPage: 100 });
    
    return {
      taxonomy: taxonomySlug,
      terms: terms.map(term => ({
        id: term.id,
        name: term.name,
        slug: term.slug,
        description: term.description || '',
        parent: term.parent || 0,
        count: term.count || 0,
      })),
    };
  } catch (error) {
    console.error(`      ✗ Error fetching ${taxonomySlug}:`, error.message);
    return {
      taxonomy: taxonomySlug,
      terms: [],
      error: error.message,
    };
  }
}

/**
 * Fetch all custom taxonomies for a site
 */
async function fetchSiteCustomTaxonomies(site) {
  console.log(`\n============================================================`);
  console.log(`Fetching Custom Taxonomies: ${site.name}`);
  console.log(`============================================================`);
  
  const auth = await loadWordPressAuth(site.slug);
  if (!auth) {
    console.error(`  ✗ No authentication credentials found`);
    return;
  }
  
  const outputDir = path.join(__dirname, `../organizations/${site.slug}/raw-data`);
  await fs.mkdir(outputDir, { recursive: true });
  
  const customTaxonomies = {};
  let totalTerms = 0;
  
  for (const taxonomySlug of site.customTaxonomies) {
    const result = await fetchTaxonomyTerms(site.baseUrl, taxonomySlug, auth);
    customTaxonomies[taxonomySlug] = result.terms;
    totalTerms += result.terms.length;
    
    if (result.terms.length > 0) {
      console.log(`      ✓ Fetched ${result.terms.length} terms`);
    } else if (result.error) {
      console.log(`      ✗ Failed: ${result.error}`);
    } else {
      console.log(`      ⚠ No terms found`);
    }
  }
  
  // Save to file
  const outputPath = path.join(outputDir, 'custom-taxonomies.json');
  await fs.writeFile(outputPath, JSON.stringify(customTaxonomies, null, 2));
  
  console.log(`\n  ✓ Custom taxonomies saved to: ${outputPath}`);
  console.log(`  Total terms fetched: ${totalTerms}`);
  
  return customTaxonomies;
}

/**
 * Main execution
 */
async function main() {
  console.log('============================================================');
  console.log('WordPress Custom Taxonomies Fetcher');
  console.log('============================================================\n');
  
  for (const site of SITES) {
    try {
      await fetchSiteCustomTaxonomies(site);
    } catch (error) {
      console.error(`\n✗ Error processing ${site.name}:`, error.message);
    }
  }
  
  console.log('\n============================================================');
  console.log('✓ Custom taxonomies fetch complete!');
  console.log('============================================================');
}

main().catch(console.error);

