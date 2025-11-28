/**
 * Map old WordPress field IDs to new D1 field IDs and generate update SQL
 * 
 * Strategy:
 * 1. Analyze which old field IDs are used for which post types
 * 2. Match them to new custom fields based on organization + post type patterns
 * 3. Generate SQL to update post_field_values.custom_field_id
 * 4. Then we can attach the fields
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields.csv');
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
 * Load custom fields CSV
 */
async function loadCustomFields() {
  console.log(`Reading custom_fields CSV: ${CUSTOM_FIELDS_CSV}`);
  const content = await fs.readFile(CUSTOM_FIELDS_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1);
  
  const customFields = new Map(); // id -> { organization_id, name, slug }
  const byOrgAndSlug = new Map(); // org_id:slug -> field_id
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (id && orgId && slug) {
        customFields.set(id, { organization_id: orgId, name, slug });
        const key = `${orgId}:${slug}`;
        byOrgAndSlug.set(key, id);
      }
    }
  }
  
  console.log(`   ✓ Loaded ${customFields.size} custom fields`);
  return { customFields, byOrgAndSlug };
}

/**
 * Load posts CSV
 */
async function loadPosts() {
  console.log(`\nReading posts CSV: ${POSTS_CSV}`);
  const content = await fs.readFile(POSTS_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1);
  
  const posts = new Map(); // post_id -> { post_type_id, organization_id }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      const postId = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const postTypeId = parts[2]?.trim();
      
      if (postId && postTypeId && orgId) {
        posts.set(postId, { post_type_id: postTypeId, organization_id: orgId });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${posts.size} posts`);
  return posts;
}

/**
 * Load post types CSV
 */
async function loadPostTypes() {
  console.log(`\nReading post_types CSV: ${POST_TYPES_CSV}`);
  const content = await fs.readFile(POST_TYPES_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1);
  
  const postTypes = new Map(); // post_type_id -> { slug, organization_id }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const postTypeId = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const slug = parts[3]?.trim();
      
      if (postTypeId && slug && orgId) {
        postTypes.set(postTypeId, { slug, organization_id: orgId });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${postTypes.size} post types`);
  return postTypes;
}

/**
 * Analyze old field ID usage patterns
 */
async function analyzeOldFieldUsage(posts, postTypes) {
  console.log(`\nAnalyzing old field ID usage patterns...`);
  const content = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const dataLines = lines.slice(1);
  
  // Map: old_field_id -> { organization_id, post_type_slug, usage_count, sample_value }
  const fieldUsage = new Map();
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const postId = parts[1]?.trim();
      const oldFieldId = parts[2]?.trim();
      const value = parts[3]?.trim();
      
      if (postId && oldFieldId) {
        const postInfo = posts.get(postId);
        if (postInfo) {
          const postTypeInfo = postTypes.get(postInfo.post_type_id);
          if (postTypeInfo) {
            if (!fieldUsage.has(oldFieldId)) {
              fieldUsage.set(oldFieldId, {
                organization_id: postInfo.organization_id,
                post_type_slug: postTypeInfo.slug,
                usage_count: 0,
                sample_value: value,
              });
            }
            fieldUsage.get(oldFieldId).usage_count++;
          }
        }
      }
    }
  }
  
  console.log(`   ✓ Analyzed ${fieldUsage.size} unique old field IDs`);
  return fieldUsage;
}

/**
 * Try to match old field IDs to new ones
 * Strategy: Match by organization + post type + field usage patterns
 */
function matchFields(oldFieldUsage, byOrgAndSlug, customFields) {
  console.log(`\nAttempting to match old field IDs to new ones...`);
  
  const matches = new Map(); // old_field_id -> new_field_id
  const unmatched = [];
  
  // Group custom fields by organization and post type usage
  // We'll try to match based on which fields are available for each org/post type combo
  
  for (const [oldFieldId, usage] of oldFieldUsage.entries()) {
    const orgId = usage.organization_id;
    const postTypeSlug = usage.post_type_slug;
    
    // Get all custom fields for this organization
    const orgFields = Array.from(customFields.entries())
      .filter(([id, field]) => field.organization_id === orgId);
    
    // For now, we can't automatically match without more context
    // We'll generate a report for manual matching
    unmatched.push({
      old_field_id: oldFieldId,
      organization_id: orgId,
      post_type_slug: postTypeSlug,
      usage_count: usage.usage_count,
      sample_value: usage.sample_value,
      available_fields_in_org: orgFields.length,
    });
  }
  
  console.log(`   ⚠ Could not automatically match ${unmatched.length} field IDs`);
  console.log(`   ✓ Matched ${matches.size} field IDs`);
  
  return { matches, unmatched };
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Map Old Field IDs to New Field IDs');
    console.log('============================================================\n');
    
    // Load data
    const { customFields, byOrgAndSlug } = await loadCustomFields();
    const posts = await loadPosts();
    const postTypes = await loadPostTypes();
    
    // Analyze old field usage
    const oldFieldUsage = await analyzeOldFieldUsage(posts, postTypes);
    
    // Try to match
    const { matches, unmatched } = matchFields(oldFieldUsage, byOrgAndSlug, customFields);
    
    // Generate report
    console.log(`\n============================================================`);
    console.log('MATCHING REPORT');
    console.log(`============================================================`);
    console.log(`\nMatched: ${matches.size}`);
    console.log(`Unmatched: ${unmatched.length}`);
    
    // Save unmatched for analysis
    const reportPath = path.join(__dirname, 'unmatched-field-ids.json');
    await fs.writeFile(reportPath, JSON.stringify(unmatched.slice(0, 500), null, 2), 'utf-8');
    console.log(`\n✓ Saved first 500 unmatched fields to: ${reportPath}`);
    
    // Generate SQL to update post_field_values (for matched fields)
    if (matches.size > 0) {
      const sqlStatements = [];
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('-- Update post_field_values.custom_field_id from old IDs to new IDs');
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('');
      
      for (const [oldId, newId] of matches.entries()) {
        sqlStatements.push(`UPDATE post_field_values`);
        sqlStatements.push(`SET custom_field_id = '${newId}'`);
        sqlStatements.push(`WHERE custom_field_id = '${oldId}';`);
        sqlStatements.push('');
      }
      
      const sqlPath = path.join(__dirname, 'update-field-ids.sql');
      await fs.writeFile(sqlPath, sqlStatements.join('\n'), 'utf-8');
      console.log(`\n✓ Generated update SQL: ${sqlPath}`);
    }
    
    console.log(`\n⚠️  Note: ${unmatched.length} field IDs need manual mapping.`);
    console.log(`   Review the unmatched-field-ids.json file to create a mapping.`);
    console.log(`   Then update the script to use the mapping and regenerate the SQL.`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
