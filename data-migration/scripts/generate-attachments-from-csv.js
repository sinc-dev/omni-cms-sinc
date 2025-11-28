/**
 * Generate post_type_fields INSERT statements from CSV files
 * 
 * This script traces through the CSV data to find which custom fields
 * are used by which post types, then generates INSERT statements.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, '5-15-pm-28-11-2025-post_field_values.csv');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');
const POST_TYPES_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');

/**
 * Parse CSV line (handles quoted values with commas)
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
 * Load post_field_values CSV
 */
async function loadFieldValues() {
  console.log(`Reading post_field_values CSV: ${POST_FIELD_VALUES_CSV}`);
  const content = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1); // Skip header
  
  const fieldValues = new Map(); // post_id -> Set of custom_field_ids
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      const postId = parts[1]?.trim();
      const customFieldId = parts[2]?.trim();
      
      if (postId && customFieldId) {
        if (!fieldValues.has(postId)) {
          fieldValues.set(postId, new Set());
        }
        fieldValues.get(postId).add(customFieldId);
      }
    }
  }
  
  console.log(`   ✓ Found ${fieldValues.size} posts with field values`);
  return fieldValues;
}

/**
 * Load posts CSV to map post_id -> post_type_id
 * Format: id,organization_id,post_type_id,...
 */
async function loadPosts() {
  console.log(`\nReading posts CSV: ${POSTS_CSV}`);
  const content = await fs.readFile(POSTS_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1); // Skip header
  
  const posts = new Map(); // post_id -> { post_type_id, organization_id }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      const postId = parts[0]?.trim(); // id column
      const orgId = parts[1]?.trim(); // organization_id column
      const postTypeId = parts[2]?.trim(); // post_type_id column
      
      if (postId && postTypeId && orgId) {
        posts.set(postId, {
          post_type_id: postTypeId,
          organization_id: orgId,
        });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${posts.size} post mappings`);
  return posts;
}

/**
 * Load post_types CSV to map post_type_id -> { slug, organization_id }
 * Format: id,organization_id,name,slug,...
 */
async function loadPostTypes() {
  console.log(`\nReading post_types CSV: ${POST_TYPES_CSV}`);
  const content = await fs.readFile(POST_TYPES_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1); // Skip header
  
  const postTypes = new Map(); // post_type_id -> { slug, organization_id }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const postTypeId = parts[0]?.trim(); // id column
      const orgId = parts[1]?.trim(); // organization_id column
      const slug = parts[3]?.trim(); // slug column (4th column, index 3)
      
      if (postTypeId && slug && orgId) {
        postTypes.set(postTypeId, {
          slug: slug,
          organization_id: orgId,
        });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${postTypes.size} post type mappings`);
  return postTypes;
}

/**
 * Map organization_id to slug
 */
const ORG_MAP = {
  '3Kyv3hvrybf_YohTZRgPV': 'study-in-north-cyprus',
  'IBfLssGjH23-f9uxjH5Ms': 'study-in-kazakhstan',
  'ND-k8iHHx70s5XaW28Mk2': 'paris-american-international-university',
};

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Generate Post Type Field Attachments from CSV');
    console.log('============================================================\n');
    
    // Load all CSV data
    console.log('Step 1: Loading CSV files...');
    const fieldValues = await loadFieldValues();
    const posts = await loadPosts();
    const postTypes = await loadPostTypes();
    
    console.log(`\nLoaded data:`);
    console.log(`  - Field values: ${fieldValues.size} posts`);
    console.log(`  - Posts: ${posts.size} posts`);
    console.log(`  - Post types: ${postTypes.size} post types`);
    
    // Build mapping: post_type_id -> Set of custom_field_ids
    console.log('\nBuilding post type to field mapping...');
    const postTypeFields = new Map(); // post_type_id -> Map(custom_field_id -> count)
    const postTypeInfo = new Map(); // post_type_id -> { slug, org_slug, org_id }
    
    let mappedPosts = 0;
    let skippedPosts = 0;
    
    for (const [postId, fieldIds] of fieldValues.entries()) {
      const postInfo = posts.get(postId);
      if (!postInfo) {
        skippedPosts++;
        continue;
      }
      
      const postTypeId = postInfo.post_type_id;
      const postTypeInfo_data = postTypes.get(postTypeId);
      if (!postTypeInfo_data) {
        skippedPosts++;
        continue;
      }
      
      if (!postTypeFields.has(postTypeId)) {
        postTypeFields.set(postTypeId, new Map());
        const orgSlug = ORG_MAP[postInfo.organization_id] || 'unknown';
        postTypeInfo.set(postTypeId, {
          slug: postTypeInfo_data.slug,
          org_slug: orgSlug,
          org_id: postInfo.organization_id,
        });
      }
      
      for (const fieldId of fieldIds) {
        const count = postTypeFields.get(postTypeId).get(fieldId) || 0;
        postTypeFields.get(postTypeId).set(fieldId, count + 1);
      }
      
      mappedPosts++;
    }
    
    console.log(`   ✓ Mapped ${mappedPosts} posts`);
    if (skippedPosts > 0) {
      console.log(`   ⚠ Skipped ${skippedPosts} posts (not found in mapping CSVs)`);
    }
    console.log(`   ✓ Found ${postTypeFields.size} post types with field usage`);
    
    // Generate SQL
    console.log('\nGenerating SQL...');
    const sqlStatements = [];
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- Fix Missing Custom Field Attachments');
    sqlStatements.push('-- Generated from CSV files');
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');
    
    // Group by organization
    const byOrg = new Map();
    for (const [postTypeId, fields] of postTypeFields.entries()) {
      const info = postTypeInfo.get(postTypeId);
      if (!byOrg.has(info.org_slug)) {
        byOrg.set(info.org_slug, []);
      }
      byOrg.get(info.org_slug).push({ postTypeId, fields, info });
    }
    
    for (const [orgSlug, attachments] of byOrg.entries()) {
      sqlStatements.push(`-- Organization: ${orgSlug}`);
      const totalFields = attachments.reduce((sum, a) => sum + a.fields.size, 0);
      sqlStatements.push(`-- Total fields to attach: ${totalFields}`);
      sqlStatements.push('');
      
      for (const { postTypeId, fields, info } of attachments) {
        sqlStatements.push(`-- Post Type: ${info.slug} (${fields.size} unique fields)`);
        sqlStatements.push(`-- Post Type ID: ${postTypeId}`);
        sqlStatements.push('');
        
        // Generate direct INSERT statements for each field
        const fieldIds = Array.from(fields.keys());
        const batchSize = 100; // Insert in batches to avoid huge statements
        
        for (let i = 0; i < fieldIds.length; i += batchSize) {
          const batch = fieldIds.slice(i, i + batchSize);
          
          // Use SELECT with JOIN to custom_fields to ensure foreign key constraint is satisfied
          sqlStatements.push(`INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)`);
          sqlStatements.push(`SELECT`);
          sqlStatements.push(`    lower(hex(randomblob(12))) AS id,`);
          sqlStatements.push(`    '${postTypeId}' AS post_type_id,`);
          sqlStatements.push(`    cf.id AS custom_field_id,`);
          sqlStatements.push(`    0 AS is_required,`);
          sqlStatements.push(`    1 AS "order",`);
          sqlStatements.push(`    unixepoch() AS created_at`);
          sqlStatements.push(`FROM custom_fields cf`);
          sqlStatements.push(`WHERE cf.id IN (${batch.map(id => `'${id}'`).join(', ')})`);
          sqlStatements.push(`  AND NOT EXISTS (`);
          sqlStatements.push(`    SELECT 1 FROM post_type_fields ptf`);
          sqlStatements.push(`    WHERE ptf.post_type_id = '${postTypeId}'`);
          sqlStatements.push(`      AND ptf.custom_field_id = cf.id`);
          sqlStatements.push(`  );`);
          sqlStatements.push('');
        }
      }
    }
    
    // Write SQL file
    const sqlPath = path.join(__dirname, 'fix-missing-field-attachments-from-csv.sql');
    const sqlContent = sqlStatements.join('\n');
    
    await fs.writeFile(sqlPath, sqlContent, 'utf-8');
  
    console.log(`\n✅ SQL file generated: ${sqlPath}`);
    console.log(`   Total post types: ${postTypeFields.size}`);
    console.log(`   Total unique field attachments: ${Array.from(postTypeFields.values()).reduce((sum, fields) => sum + fields.size, 0)}`);
    console.log(`   File size: ${sqlContent.length} characters`);
    console.log(`\n   Run it with: npx wrangler d1 execute omni-cms --remote --file=${sqlPath}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

