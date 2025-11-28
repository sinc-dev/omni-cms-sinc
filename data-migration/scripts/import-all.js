/**
 * Import All Data to Omni-CMS
 * 
 * Main import script that orchestrates the entire import process
 * Follows the correct order: post types → taxonomies → terms → custom fields → attach fields to post types → media → posts → relationships → update media references
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrganizationId } from '../shared/utils/api-client.js';
import { importPostTypes } from './import-post-types.js';
import { importTaxonomies } from './import-taxonomies.js';
import { importTaxonomyTerms } from './import-taxonomy-terms.js';
import { importCustomFields } from './import-custom-fields.js';
import { attachCustomFieldsToPostTypes } from './attach-custom-fields-to-post-types.js';
import { importMedia } from './import-media.js';
import { importPosts } from './import-posts.js';
import { importRelationships } from './import-relationships.js';
import { updateMediaReferences } from './update-media-references.js';
import { filterExistingData } from './filter-existing-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OMNI_CMS_BASE_URL = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
const TEST_MODE = process.env.TEST_MODE === 'true' || process.argv.includes('--test');
const TEST_LIMIT = parseInt(process.env.TEST_LIMIT || '40'); // Limit records for testing
const SKIP_MEDIA = process.env.SKIP_MEDIA === 'true' || process.argv.includes('--skip-media');

const ORGANIZATIONS = [
  { 
    slug: 'study-in-kazakhstan', 
    name: 'Study In Kazakhstan',
    apiKey: process.env.OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN || process.env.OMNI_CMS_API_KEY
  },
  { 
    slug: 'study-in-north-cyprus', 
    name: 'Study in North Cyprus',
    apiKey: process.env.OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS || process.env.OMNI_CMS_API_KEY
  },
  { 
    slug: 'paris-american-international-university', 
    name: 'Paris American International University',
    apiKey: process.env.OMNI_CMS_API_KEY_PARIS_AMERICAN || process.env.OMNI_CMS_API_KEY
  },
];

/**
 * Main import function
 */
async function importOrganization(orgSlug, baseUrl, apiKey) {
  console.log(`\n============================================================`);
  console.log(`Importing: ${orgSlug}`);
  console.log(`============================================================\n`);

  // Set API key in environment for this organization
  const originalApiKey = process.env.OMNI_CMS_API_KEY;
  process.env.OMNI_CMS_API_KEY = apiKey;

  try {
    // Get organization ID
    console.log('1. Getting organization ID...');
    const orgId = await getOrganizationId(baseUrl, orgSlug, apiKey);
    console.log(`   ✓ Organization ID: ${orgId}\n`);

    // Pre-filter: Query existing data to avoid duplicate API calls
    console.log('0. Pre-filtering: Querying existing data from database...');
    const existingData = await filterExistingData(baseUrl, orgId, apiKey);
    console.log(`   ✓ Found ${existingData.existingPostsByType.size} post types with existing posts\n`);

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

    // Step 4.5: Attach Custom Fields to Post Types
    console.log('5.5. Attaching custom fields to post types...');
    const attachmentResult = await attachCustomFieldsToPostTypes(baseUrl, orgId, orgSlug);
    console.log(`   ✓ Attached ${attachmentResult.attached} fields, skipped ${attachmentResult.skipped}\n`);

    // Step 5: Upload Media (or load existing mappings)
    let mediaMap = new Map();
    if (SKIP_MEDIA) {
      console.log('6. Loading existing media mappings...');
      try {
        const mediaMappingPath = path.join(__dirname, `../organizations/${orgSlug}/import-mappings/media.json`);
        const mediaMappingData = await fs.readFile(mediaMappingPath, 'utf-8');
        const mediaMappings = JSON.parse(mediaMappingData);
        Object.entries(mediaMappings).forEach(([wpId, omniId]) => {
          mediaMap.set(parseInt(wpId), omniId);
        });
        console.log(`   ✓ Loaded ${mediaMap.size} existing media mappings\n`);
      } catch (error) {
        console.warn(`   ⚠ Could not load media mappings: ${error.message}`);
        console.log(`   Continuing without media mappings...\n`);
      }
    } else {
      console.log('6. Uploading media files...');
      const mediaTestLimit = TEST_MODE ? TEST_LIMIT : null;
      mediaMap = await importMedia(baseUrl, orgId, orgSlug, mediaTestLimit);
      console.log(`   ✓ Uploaded ${mediaMap.size} media files\n`);
    }

    // Step 6: Import Posts (using cached existing data to skip duplicates)
    console.log('7. Importing posts...');
    const testLimit = TEST_MODE ? TEST_LIMIT : null;
    // Pass existingPostsByType to skip already-imported posts
    const postMap = await importPosts(baseUrl, orgId, orgSlug, postTypeMap, termMap, customFieldMap, mediaMap, testLimit, apiKey, existingData.existingPostsByType);
    
    // Show summary of what was imported vs skipped
    const totalPosts = postMap.size;
    console.log(`   ✓ Imported posts (${totalPosts} total in database)\n`);

    // Step 7: Import Relationships
    console.log('8. Importing relationships...');
    await importRelationships(baseUrl, orgId, orgSlug, postMap, apiKey);
    console.log(`   ✓ Imported relationships\n`);

    // Step 8: Update Media References
    console.log('9. Updating media references in posts...');
    await updateMediaReferences(baseUrl, orgId, orgSlug, apiKey);
    console.log(`   ✓ Updated media references\n`);

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
  } finally {
    // Restore original API key
    if (originalApiKey !== undefined) {
      process.env.OMNI_CMS_API_KEY = originalApiKey;
    }
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
  if (SKIP_MEDIA) {
    console.log(`⏭️  SKIP MEDIA: Loading existing media mappings instead of uploading`);
  }
  console.log('');

  // Validate API keys are provided
  const missingKeys = ORGANIZATIONS.filter(org => !org.apiKey);
  if (missingKeys.length > 0) {
    console.error('\n❌ Error: Missing API keys for the following organizations:');
    missingKeys.forEach(org => {
      console.error(`   - ${org.name} (${org.slug})`);
    });
    console.error('\nPlease set the appropriate environment variables:');
    console.error('   - OMNI_CMS_API_KEY (for all organizations)');
    console.error('   - OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN');
    console.error('   - OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS');
    console.error('   - OMNI_CMS_API_KEY_PARIS_AMERICAN');
    process.exit(1);
  }

  const results = [];

  for (const org of ORGANIZATIONS) {
    try {
      const result = await importOrganization(org.slug, OMNI_CMS_BASE_URL, org.apiKey);
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

