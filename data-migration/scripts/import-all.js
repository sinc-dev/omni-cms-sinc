/**
 * Import All Data to Omni-CMS
 * 
 * Main import script that orchestrates the entire import process
 * Follows the correct order: post types → taxonomies → terms → custom fields → media → posts → relationships
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrganizationId } from '../shared/utils/api-client.js';
import { importPostTypes } from './import-post-types.js';
import { importTaxonomies } from './import-taxonomies.js';
import { importTaxonomyTerms } from './import-taxonomy-terms.js';
import { importCustomFields } from './import-custom-fields.js';
import { importMedia } from './import-media.js';
import { importPosts } from './import-posts.js';
import { importRelationships } from './import-relationships.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OMNI_CMS_BASE_URL = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
const TEST_MODE = process.env.TEST_MODE === 'true' || process.argv.includes('--test');
const TEST_LIMIT = parseInt(process.env.TEST_LIMIT || '40'); // Limit records for testing

const ORGANIZATIONS = [
  { slug: 'study-in-kazakhstan', name: 'Study In Kazakhstan' },
  { slug: 'study-in-north-cyprus', name: 'Study in North Cyprus' },
  { slug: 'paris-american-international-university', name: 'Paris American International University' },
];

/**
 * Main import function
 */
async function importOrganization(orgSlug, baseUrl) {
  console.log(`\n============================================================`);
  console.log(`Importing: ${orgSlug}`);
  console.log(`============================================================\n`);

  try {
    // Get organization ID
    console.log('1. Getting organization ID...');
    const orgId = await getOrganizationId(baseUrl, orgSlug);
    console.log(`   ✓ Organization ID: ${orgId}\n`);

    // Step 1: Import Post Types
    console.log('2. Importing post types...');
    const postTypeMap = await importPostTypes(baseUrl, orgId, orgSlug);
    console.log(`   ✓ Imported ${postTypeMap.size} post types\n`);

    // Step 2: Import Taxonomies
    console.log('3. Importing taxonomies...');
    const taxonomyMap = await importTaxonomies(baseUrl, orgId, orgSlug);
    console.log(`   ✓ Imported ${taxonomyMap.size} taxonomies\n`);

    // Step 3: Import Taxonomy Terms
    console.log('4. Importing taxonomy terms...');
    const termMap = await importTaxonomyTerms(baseUrl, orgId, orgSlug, taxonomyMap);
    console.log(`   ✓ Imported taxonomy terms\n`);

    // Step 4: Import Custom Fields
    console.log('5. Importing custom fields...');
    const customFieldMap = await importCustomFields(baseUrl, orgId, orgSlug);
    console.log(`   ✓ Imported ${customFieldMap.size} custom fields\n`);

    // Step 5: Upload Media
    console.log('6. Uploading media files...');
    const mediaTestLimit = TEST_MODE ? TEST_LIMIT : null;
    const mediaMap = await importMedia(baseUrl, orgId, orgSlug, mediaTestLimit);
    console.log(`   ✓ Uploaded ${mediaMap.size} media files\n`);

    // Step 6: Import Posts
    console.log('7. Importing posts...');
    const testLimit = TEST_MODE ? TEST_LIMIT : null;
    const postMap = await importPosts(baseUrl, orgId, orgSlug, postTypeMap, termMap, customFieldMap, mediaMap, testLimit);
    console.log(`   ✓ Imported posts\n`);

    // Step 7: Import Relationships
    console.log('8. Importing relationships...');
    await importRelationships(baseUrl, orgId, orgSlug, postMap);
    console.log(`   ✓ Imported relationships\n`);

    console.log(`\n✓ Import complete for ${orgSlug}!`);
    
    return {
      success: true,
      postTypes: postTypeMap.size,
      taxonomies: taxonomyMap.size,
      media: mediaMap.size,
      posts: postMap.size,
    };
  } catch (error) {
    console.error(`\n✗ Error importing ${orgSlug}:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('============================================================');
  console.log('Omni-CMS Data Import');
  console.log('============================================================');
  console.log(`Base URL: ${OMNI_CMS_BASE_URL}`);
  if (TEST_MODE) {
    console.log(`⚠️  TEST MODE: Limiting to ${TEST_LIMIT} records per content type`);
  }
  console.log('');

  const results = [];

  for (const org of ORGANIZATIONS) {
    try {
      const result = await importOrganization(org.slug, OMNI_CMS_BASE_URL);
      results.push({ org: org.slug, ...result });
    } catch (error) {
      console.error(`Failed to import ${org.slug}:`, error.message);
      results.push({ org: org.slug, success: false, error: error.message });
    }
  }

  // Summary
  console.log('\n============================================================');
  console.log('Import Summary');
  console.log('============================================================');
  results.forEach(result => {
    if (result.success) {
      console.log(`\n${result.org}:`);
      console.log(`  Post Types: ${result.postTypes}`);
      console.log(`  Taxonomies: ${result.taxonomies}`);
      console.log(`  Media: ${result.media}`);
      console.log(`  Posts: ${result.posts}`);
    } else {
      console.log(`\n${result.org}: FAILED - ${result.error}`);
    }
  });
}

main().catch(console.error);

