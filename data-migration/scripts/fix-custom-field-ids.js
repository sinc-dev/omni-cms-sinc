/**
 * Fix Custom Field IDs - Map Unknown Fields to Proper Custom Fields
 * 
 * Problem:
 * - We created ~66,188 "Unknown Field" custom fields with IDs like "e45fa4d786982a9645314b2b"
 * - post_field_values uses these unknown field IDs
 * - We need to map them to proper custom field IDs from custom_fields.csv
 * 
 * Strategy:
 * 1. Load proper custom fields from custom_fields.csv
 * 2. Load unknown fields from custom_fields_table_more_recent.csv
 * 3. Analyze post_field_values to see which unknown fields are used for which post types
 * 4. Use heuristics to match unknown fields to proper fields based on:
 *    - Organization + Post Type + Value patterns
 *    - WordPress import mappings (if available)
 * 5. Generate SQL to update post_field_values.custom_field_id
 * 6. Generate SQL to update post_type_fields.custom_field_id
 * 7. Generate SQL to delete unknown field custom fields
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CORRECT_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields.csv');
const ALL_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, '5-15-pm-28-11-2025-post_field_values.csv');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');
const POST_TYPES_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');

/**
 * Parse CSV line (handles quoted values)
 */
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  return parts;
}

/**
 * Load WordPress import mappings
 */
async function loadWordPressMappings() {
  const orgsDir = path.join(__dirname, '..', 'organizations');
  const organizations = ['study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university'];
  
  const mappings = new Map(); // orgSlug -> { wpFieldSlug -> newFieldId }
  
  for (const orgSlug of organizations) {
    const mappingPath = path.join(orgsDir, orgSlug, 'import-mappings', 'custom-fields.json');
    try {
      const content = await fs.readFile(mappingPath, 'utf-8');
      const mapping = JSON.parse(content);
      mappings.set(orgSlug, mapping);
    } catch (error) {
      mappings.set(orgSlug, {});
    }
  }
  
  return mappings;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Fix Custom Field IDs - Analysis');
    console.log('============================================================\n');
    
    // Load correct custom fields
    console.log('Loading correct custom fields...');
    const correctFieldsContent = await fs.readFile(CORRECT_FIELDS_CSV, 'utf-8');
    const correctFieldsLines = correctFieldsContent.split('\n').filter(line => line.trim());
    const correctFieldsHeader = correctFieldsLines[0]?.split(',');
    
    const correctFields = new Map(); // id -> { orgId, name, slug }
    const correctFieldsByOrgAndSlug = new Map(); // orgId:slug -> id
    
    for (let i = 1; i < correctFieldsLines.length; i++) {
      const parts = parseCSVLine(correctFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (id && orgId && slug) {
        correctFields.set(id, { orgId, name, slug });
        const key = `${orgId}:${slug}`;
        correctFieldsByOrgAndSlug.set(key, id);
      }
    }
    
    console.log(`   ✓ Loaded ${correctFields.size} correct custom fields`);
    
    // Load WordPress mappings
    console.log('\nLoading WordPress import mappings...');
    const wpMappings = await loadWordPressMappings();
    for (const [orgSlug, mapping] of wpMappings.entries()) {
      const count = Object.keys(mapping).length;
      console.log(`   ✓ ${orgSlug}: ${count} field mappings`);
    }
    
    // Load posts to get organization and post type info
    console.log('\nLoading posts...');
    const postsContent = await fs.readFile(POSTS_CSV, 'utf-8');
    const postsLines = postsContent.split('\n').filter(line => line.trim());
    const postsHeader = postsLines[0]?.split(',');
    const postIdIndex = postsHeader?.indexOf('id');
    const orgIdIndex = postsHeader?.indexOf('organization_id');
    const postTypeIdIndex = postsHeader?.indexOf('post_type_id');
    
    const postInfo = new Map(); // postId -> { orgId, postTypeId }
    
    for (let i = 1; i < postsLines.length; i++) {
      const parts = parseCSVLine(postsLines[i]);
      const postId = parts[postIdIndex]?.trim();
      const orgId = parts[orgIdIndex]?.trim();
      const postTypeId = parts[postTypeIdIndex]?.trim();
      
      if (postId && orgId && postTypeId) {
        postInfo.set(postId, { orgId, postTypeId });
      }
    }
    
    console.log(`   ✓ Loaded ${postInfo.size} posts`);
    
    // Load post types to get slugs
    console.log('\nLoading post types...');
    const postTypesContent = await fs.readFile(POST_TYPES_CSV, 'utf-8');
    const postTypesLines = postTypesContent.split('\n').filter(line => line.trim());
    const postTypesHeader = postTypesLines[0]?.split(',');
    const ptIdIndex = postTypesHeader?.indexOf('id');
    const ptSlugIndex = postTypesHeader?.indexOf('slug');
    
    const postTypeSlugs = new Map(); // postTypeId -> slug
    
    for (let i = 1; i < postTypesLines.length; i++) {
      const parts = parseCSVLine(postTypesLines[i]);
      const ptId = parts[ptIdIndex]?.trim();
      const ptSlug = parts[ptSlugIndex]?.trim();
      
      if (ptId && ptSlug) {
        postTypeSlugs.set(ptId, ptSlug);
      }
    }
    
    console.log(`   ✓ Loaded ${postTypeSlugs.size} post types`);
    
    // Analyze post_field_values to understand usage patterns
    console.log('\nAnalyzing post_field_values...');
    const valuesContent = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
    const valuesLines = valuesContent.split('\n').filter(line => line.trim());
    const valuesHeader = valuesLines[0]?.split(',');
    const pvPostIdIndex = valuesHeader?.indexOf('post_id');
    const pvFieldIdIndex = valuesHeader?.indexOf('custom_field_id');
    const pvValueIndex = valuesHeader?.indexOf('value');
    
    // Group by unknown field ID to see usage patterns
    const unknownFieldUsage = new Map(); // unknownFieldId -> { orgId, postTypeSlug, sampleValues, count }
    const fieldIdToOrgAndPostType = new Map(); // fieldId -> Set of {orgId, postTypeSlug}
    
    for (let i = 1; i < valuesLines.length; i++) {
      const parts = parseCSVLine(valuesLines[i]);
      const postId = parts[pvPostIdIndex]?.trim();
      const fieldId = parts[pvFieldIdIndex]?.trim();
      const value = parts[pvValueIndex]?.trim();
      
      if (postId && fieldId) {
        const post = postInfo.get(postId);
        if (post) {
          const postTypeSlug = postTypeSlugs.get(post.postTypeId) || 'unknown';
          const key = `${post.orgId}:${postTypeSlug}`;
          
          if (!fieldIdToOrgAndPostType.has(fieldId)) {
            fieldIdToOrgAndPostType.set(fieldId, new Set());
          }
          fieldIdToOrgAndPostType.get(fieldId).add(key);
          
          // Check if this is an unknown field (we'll check later)
          if (!unknownFieldUsage.has(fieldId)) {
            unknownFieldUsage.set(fieldId, {
              orgId: post.orgId,
              postTypeSlug: postTypeSlug,
              sampleValues: [],
              count: 0
            });
          }
          
          const usage = unknownFieldUsage.get(fieldId);
          usage.count++;
          if (usage.sampleValues.length < 3 && value) {
            usage.sampleValues.push(value.substring(0, 100)); // First 100 chars
          }
        }
      }
    }
    
    console.log(`   ✓ Analyzed ${fieldIdToOrgAndPostType.size} unique custom field IDs`);
    
    // Load unknown fields
    console.log('\nLoading unknown fields...');
    const allFieldsContent = await fs.readFile(ALL_FIELDS_CSV, 'utf-8');
    const allFieldsLines = allFieldsContent.split('\n').filter(line => line.trim());
    
    const unknownFields = new Map(); // id -> { orgId, slug }
    
    for (let i = 1; i < allFieldsLines.length; i++) {
      const parts = parseCSVLine(allFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (name === 'Unknown Field' || slug?.startsWith('unknown-field-')) {
        unknownFields.set(id, { orgId, slug });
      }
    }
    
    console.log(`   ✓ Found ${unknownFields.size} unknown fields`);
    
    // Now we need to figure out how to map unknown fields to correct fields
    // This is complex - we'll need to use heuristics or check if there's a pattern
    
    console.log('\n============================================================');
    console.log('ANALYSIS COMPLETE');
    console.log('============================================================');
    console.log('\nThe challenge:');
    console.log(`  - ${unknownFields.size} unknown fields need to be mapped`);
    console.log(`  - ${fieldIdToOrgAndPostType.size} unique field IDs in use`);
    console.log('\nRecommendation:');
    console.log('  We need to check WordPress raw data or import logs to see');
    console.log('  what the original custom field names/keys were.');
    console.log('  Without that mapping, we cannot reliably map unknown fields.');
    console.log('\nAlternative approach:');
    console.log('  1. Check if WordPress export has custom field metadata');
    console.log('  2. Or use value patterns to infer field types');
    console.log('  3. Or check database for any field name mappings');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

