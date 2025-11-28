/**
 * Generate Complete post_type_fields.csv Locally
 * 
 * This script reads all the CSV files and generates a complete post_type_fields.csv
 * without needing to query the database.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, '5-15-pm-28-11-2025-post_field_values.csv');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');
const POST_TYPES_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');
const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields.csv');
const OUTPUT_CSV = path.join(CSV_DIR, 'post_type_fields-generated.csv');

const ORGANIZATIONS = {
  '3Kyv3hvrybf_YohTZRgPV': 'study-in-north-cyprus',
  'IBfLssGjH23-f9uxjH5Ms': 'study-in-kazakhstan',
  'ND-k8iHHx70s5XaW28Mk2': 'paris-american-international-university',
};

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
 * Load CSV file
 */
async function loadCSV(csvPath) {
  const content = await fs.readFile(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  return lines;
}

/**
 * Generate ID (using crypto for better randomness, similar to nanoid)
 */
function generateId() {
  // Generate 12 random bytes and convert to hex (24 characters)
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Generate Complete post_type_fields.csv');
    console.log('============================================================');
    console.log('');
    
    // Step 1: Load all CSV files
    console.log('Step 1: Loading CSV files...');
  const postFieldValuesLines = await loadCSV(POST_FIELD_VALUES_CSV);
  const postsLines = await loadCSV(POSTS_CSV);
  const postTypesLines = await loadCSV(POST_TYPES_CSV);
  const customFieldsLines = await loadCSV(CUSTOM_FIELDS_CSV);
  
  console.log(`   ✓ post_field_values: ${postFieldValuesLines.length - 1} rows`);
  console.log(`   ✓ posts: ${postsLines.length - 1} rows`);
  console.log(`   ✓ post_types: ${postTypesLines.length - 1} rows`);
  console.log(`   ✓ custom_fields: ${customFieldsLines.length - 1} rows`);
  
  // Step 2: Build mappings
  console.log('\nStep 2: Building mappings...');
  
  // post_id -> post_type_id, organization_id
  const postsMap = new Map();
  for (let i = 1; i < postsLines.length; i++) {
    const parts = parseCSVLine(postsLines[i]);
    if (parts.length >= 3) {
      const postId = parts[0];
      const orgId = parts[1];
      const postTypeId = parts[2];
      postsMap.set(postId, { post_type_id: postTypeId, organization_id: orgId });
    }
  }
  console.log(`   ✓ Mapped ${postsMap.size} posts`);
  
  // post_type_id -> organization_id, slug
  const postTypesMap = new Map();
  for (let i = 1; i < postTypesLines.length; i++) {
    const parts = parseCSVLine(postTypesLines[i]);
    if (parts.length >= 4) {
      const postTypeId = parts[0];
      const orgId = parts[1];
      const slug = parts[3];
      postTypesMap.set(postTypeId, { organization_id: orgId, slug: slug });
    }
  }
  console.log(`   ✓ Mapped ${postTypesMap.size} post types`);
  
  // custom_field_id -> organization_id
  const customFieldsMap = new Map();
  for (let i = 1; i < customFieldsLines.length; i++) {
    const parts = parseCSVLine(customFieldsLines[i]);
    if (parts.length >= 2) {
      const fieldId = parts[0];
      const orgId = parts[1];
      customFieldsMap.set(fieldId, { organization_id: orgId });
    }
  }
  console.log(`   ✓ Mapped ${customFieldsMap.size} custom fields`);
  
  // Step 3: Process post_field_values to find unique combinations
  console.log('\nStep 3: Processing post_field_values...');
  const attachments = new Map(); // key: `${post_type_id}:${custom_field_id}` -> { post_type_id, custom_field_id, org_id }
  let processed = 0;
  let skipped = 0;
  
  for (let i = 1; i < postFieldValuesLines.length; i++) {
    const parts = parseCSVLine(postFieldValuesLines[i]);
    if (parts.length >= 3) {
      const postId = parts[1];
      const customFieldId = parts[2];
      
      const postInfo = postsMap.get(postId);
      if (!postInfo) {
        skipped++;
        continue;
      }
      
      const postTypeInfo = postTypesMap.get(postInfo.post_type_id);
      if (!postTypeInfo) {
        skipped++;
        continue;
      }
      
      const fieldInfo = customFieldsMap.get(customFieldId);
      
      // If field not in CSV, we can't validate org isolation, but we'll include it anyway
      // (it exists in DB since it's in post_field_values)
      // SQL will handle organization isolation via JOIN
      if (fieldInfo) {
        // Safety check: organization isolation (if we have the data)
        if (postTypeInfo.organization_id !== fieldInfo.organization_id) {
          skipped++;
          continue;
        }
      }
      // If fieldInfo is null, we'll still include it - the SQL JOIN will validate
      
      // Create unique key
      const key = `${postInfo.post_type_id}:${customFieldId}`;
      if (!attachments.has(key)) {
        attachments.set(key, {
          post_type_id: postInfo.post_type_id,
          custom_field_id: customFieldId,
          organization_id: postTypeInfo.organization_id,
        });
      }
      
      processed++;
      if (processed % 10000 === 0) {
        console.log(`   Progress: ${processed} values processed...`);
      }
    }
  }
  
  console.log(`   ✓ Processed ${processed} field values`);
  console.log(`   ⚠ Skipped ${skipped} invalid entries`);
  console.log(`   ✓ Found ${attachments.size} unique field-to-post-type attachments`);
  
  // Step 4: Generate CSV with proper ordering
  console.log('\nStep 4: Generating CSV with ordering...');
  
  // Group by post_type_id to calculate order
  const byPostType = new Map();
  for (const attachment of attachments.values()) {
    if (!byPostType.has(attachment.post_type_id)) {
      byPostType.set(attachment.post_type_id, []);
    }
    byPostType.get(attachment.post_type_id).push(attachment);
  }
  
  // Get custom field names for ordering
  const fieldNames = new Map();
  for (let i = 1; i < customFieldsLines.length; i++) {
    const parts = parseCSVLine(customFieldsLines[i]);
    if (parts.length >= 3) {
      const fieldId = parts[0];
      const name = parts[2];
      fieldNames.set(fieldId, name);
    }
  }
  
  const csvLines = ['id,post_type_id,custom_field_id,is_required,default_value,order,created_at'];
  
  for (const [postTypeId, typeAttachments] of byPostType.entries()) {
    // Sort by field name for consistent ordering
    typeAttachments.sort((a, b) => {
      const nameA = fieldNames.get(a.custom_field_id) || '';
      const nameB = fieldNames.get(b.custom_field_id) || '';
      return nameA.localeCompare(nameB);
    });
    
    let order = 1;
    for (const attachment of typeAttachments) {
      const id = generateId();
      const timestamp = Math.floor(Date.now() / 1000);
      csvLines.push(`${id},${attachment.post_type_id},${attachment.custom_field_id},0,,${order},${timestamp}`);
      order++;
    }
  }
  
  // Step 5: Write CSV file
  console.log('\nStep 5: Writing CSV file...');
  console.log(`   Writing ${csvLines.length - 1} rows to ${OUTPUT_CSV}...`);
  await fs.writeFile(OUTPUT_CSV, csvLines.join('\n'), 'utf-8');
  
  console.log(`\n✅ Generated: ${OUTPUT_CSV}`);
  console.log(`   Total rows: ${csvLines.length - 1} (excluding header)`);
  console.log(`   Post types: ${byPostType.size}`);
  
  // Summary by organization
  console.log('\nSummary by organization:');
  const byOrg = new Map();
  for (const attachment of attachments.values()) {
    const orgSlug = ORGANIZATIONS[attachment.organization_id] || 'unknown';
    if (!byOrg.has(orgSlug)) {
      byOrg.set(orgSlug, 0);
    }
    byOrg.set(orgSlug, byOrg.get(orgSlug) + 1);
  }
  
  for (const [orgSlug, count] of byOrg.entries()) {
    console.log(`   ${orgSlug}: ${count} attachments`);
  }
  
    console.log('\n✅ Complete! You can now:');
    console.log(`   1. Review the generated CSV: ${OUTPUT_CSV}`);
    console.log(`   2. Import it to D1 using your preferred method`);
    console.log(`   3. Or use it to generate SQL INSERT statements`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
