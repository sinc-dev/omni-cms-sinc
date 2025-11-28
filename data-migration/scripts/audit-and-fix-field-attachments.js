/**
 * Audit and Fix Missing Custom Field Attachments
 * 
 * This script audits the database state to find custom fields that have values
 * in post_field_values but aren't attached in post_type_fields, then fixes them.
 * 
 * Uses CSV exports from the database for fast, direct analysis.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, getOrganizationId } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OMNI_CMS_BASE_URL = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, '5-15-pm-28-11-2025-post_field_values.csv');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');
const POST_TYPES_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');
const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields.csv');
const POST_TYPE_FIELDS_CSV = path.join(CSV_DIR, 'post_type_fields.csv');
const ORGANIZATIONS_DIR = path.join(__dirname, '../organizations');

const ORGANIZATIONS = [
  { 
    slug: 'study-in-kazakhstan', 
    name: 'Study In Kazakhstan',
    orgId: 'IBfLssGjH23-f9uxjH5Ms',
    apiKey: process.env.OMNI_CMS_API_KEY_STUDY_IN_KAZAKHSTAN || process.env.OMNI_CMS_API_KEY
  },
  { 
    slug: 'study-in-north-cyprus', 
    name: 'Study in North Cyprus',
    orgId: '3Kyv3hvrybf_YohTZRgPV',
    apiKey: process.env.OMNI_CMS_API_KEY_STUDY_IN_NORTH_CYPRUS || process.env.OMNI_CMS_API_KEY
  },
  { 
    slug: 'paris-american-international-university', 
    name: 'Paris American International University',
    orgId: 'ND-k8iHHx70s5XaW28Mk2',
    apiKey: process.env.OMNI_CMS_API_KEY_PARIS_AMERICAN || process.env.OMNI_CMS_API_KEY
  },
];

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
 * Parse post_field_values CSV and extract unique post_id and custom_field_id combinations
 */
async function parseFieldValuesCSV(csvPath) {
  console.log(`Reading post_field_values CSV: ${csvPath}`);
  const content = await fs.readFile(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const fieldUsage = new Map(); // post_id -> Set of custom_field_ids
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    
    if (parts.length >= 3) {
      const postId = parts[1]?.trim();
      const customFieldId = parts[2]?.trim();
      
      if (postId && customFieldId) {
        if (!fieldUsage.has(postId)) {
          fieldUsage.set(postId, new Set());
        }
        fieldUsage.get(postId).add(customFieldId);
      }
    }
  }
  
  console.log(`   ✓ Found ${fieldUsage.size} unique posts with custom field values`);
  const totalFields = Array.from(fieldUsage.values()).reduce((sum, set) => sum + set.size, 0);
  console.log(`   ✓ Total field usage entries: ${totalFields}`);
  
  return fieldUsage;
}

/**
 * Load posts CSV to get post_id -> post_type_id mapping
 */
async function loadPostsCSV(postsCsvPath) {
  console.log(`\nLoading posts CSV: ${postsCsvPath}`);
  const content = await fs.readFile(postsCsvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const mapping = new Map(); // post_id -> { post_type_id, organization_id }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 3) {
      const postId = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const postTypeId = parts[2]?.trim();
      
      if (postId && postTypeId) {
        mapping.set(postId, {
          post_type_id: postTypeId,
          organization_id: orgId,
        });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${mapping.size} post mappings`);
  return mapping;
}

/**
 * Load post types CSV to get post_type_id -> organization_id, slug mapping
 */
async function loadPostTypesCSV(postTypesCsvPath) {
  console.log(`\nLoading post types CSV: ${postTypesCsvPath}`);
  const content = await fs.readFile(postTypesCsvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const mapping = new Map(); // post_type_id -> { organization_id, slug, name }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const postTypeId = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (postTypeId && orgId && slug) {
        mapping.set(postTypeId, {
          organization_id: orgId,
          slug: slug,
          name: name,
        });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${mapping.size} post type mappings`);
  return mapping;
}

/**
 * Load custom fields CSV to get field_id -> organization_id, name, slug mapping
 */
async function loadCustomFieldsCSV(customFieldsCsvPath) {
  console.log(`\nLoading custom fields CSV: ${customFieldsCsvPath}`);
  const content = await fs.readFile(customFieldsCsvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  const mapping = new Map(); // field_id -> { organization_id, name, slug }
  
  for (const line of dataLines) {
    const parts = parseCSVLine(line);
    if (parts.length >= 4) {
      const fieldId = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (fieldId && orgId) {
        mapping.set(fieldId, {
          organization_id: orgId,
          name: name || 'unknown',
          slug: slug || 'unknown',
        });
      }
    }
  }
  
  console.log(`   ✓ Loaded ${mapping.size} custom field mappings`);
  return mapping;
}

/**
 * Load existing post_type_fields CSV to see what's already attached
 */
async function loadExistingAttachmentsCSV(postTypeFieldsCsvPath) {
  console.log(`\nLoading existing attachments CSV: ${postTypeFieldsCsvPath}`);
  try {
    const content = await fs.readFile(postTypeFieldsCsvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      console.log(`   ✓ No existing attachments found (table is empty)`);
      return new Map(); // Empty map
    }
    
    // Skip header
    const dataLines = lines.slice(1);
    
    const mapping = new Map(); // post_type_id -> Set of custom_field_ids
    
    for (const line of dataLines) {
      const parts = parseCSVLine(line);
      if (parts.length >= 3) {
        const postTypeId = parts[1]?.trim();
        const customFieldId = parts[2]?.trim();
        
        if (postTypeId && customFieldId) {
          if (!mapping.has(postTypeId)) {
            mapping.set(postTypeId, new Set());
          }
          mapping.get(postTypeId).add(customFieldId);
        }
      }
    }
    
    console.log(`   ✓ Loaded ${mapping.size} post types with existing attachments`);
    const totalAttachments = Array.from(mapping.values()).reduce((sum, set) => sum + set.size, 0);
    console.log(`   ✓ Total existing attachments: ${totalAttachments}`);
    return mapping;
  } catch (error) {
    console.log(`   ⚠ Could not load attachments CSV: ${error.message}`);
    return new Map();
  }
}

/**
 * Load custom fields mapping from JSON (if available) - for additional metadata
 */
async function loadCustomFieldsMappingJSON(orgSlug) {
  const mappingPath = path.join(ORGANIZATIONS_DIR, orgSlug, 'import-mappings', 'custom-fields.json');
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const data = JSON.parse(content);
    // Convert from { slug: id } to { id: slug } for reverse lookup
    const reverseMap = new Map();
    Object.entries(data).forEach(([slug, id]) => {
      if (id) reverseMap.set(id, slug);
    });
    return reverseMap;
  } catch (error) {
    // File doesn't exist or is empty - that's okay
    return new Map();
  }
}

/**
 * Get organization slug from organization_id
 */
function getOrgSlugFromId(orgId) {
  const org = ORGANIZATIONS.find(o => o.orgId === orgId);
  return org ? org.slug : null;
}

/**
 * Get existing field attachments for a post type
 */
async function getExistingAttachments(baseUrl, orgId, postTypeId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}`;
  try {
    const data = await apiRequest(url, { apiKey });
    
    if (!data.success || !data.data) {
      return [];
    }
    
    return data.data.fields || [];
  } catch (error) {
    console.warn(`   ⚠ Error fetching attachments: ${error.message}`);
    return [];
  }
}

/**
 * Attach a custom field to a post type via API
 */
async function attachFieldToPostType(baseUrl, orgId, postTypeId, customFieldId, order = 1, isRequired = false, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields`;
  
  try {
    const data = await apiRequest(url, {
      method: 'POST',
      body: {
        custom_field_id: customFieldId,
        is_required: isRequired,
        order: order,
      },
      apiKey,
    });
    
    if (!data.success) {
      throw new Error(`Failed to attach field: ${data.message || 'Unknown error'}`);
    }
    
    return data.data;
  } catch (error) {
    // If field is already attached, that's okay - skip it
    if (error.message && (error.message.includes('already exists') || error.message.includes('duplicate'))) {
      return null; // Already attached, skip
    }
    throw error;
  }
}

/**
 * Audit and fix using CSV data
 */
async function auditAndFixFromCSV(fieldValuesCsvPath, postsCsvPath, postTypesCsvPath, baseUrl, options = {}) {
  const { method = 'sql', dryRun = false, orgFilter = null } = options;
  
  console.log('============================================================');
  console.log('Audit and Fix Missing Custom Field Attachments');
  console.log('============================================================');
  console.log(`Method: ${method}`);
  console.log(`Dry Run: ${dryRun}`);
  if (orgFilter) {
    console.log(`Organization Filter: ${orgFilter}`);
  }
  console.log('');
  
  // Step 1: Load all CSV files
  const fieldUsage = await parseFieldValuesCSV(fieldValuesCsvPath);
  const postsMapping = await loadPostsCSV(postsCsvPath);
  const postTypesMapping = await loadPostTypesCSV(postTypesCsvPath);
  
  // Load custom fields and existing attachments (if CSV files exist)
  let customFieldsMapping = new Map();
  let existingAttachments = new Map();
  
  try {
    await fs.access(CUSTOM_FIELDS_CSV);
    customFieldsMapping = await loadCustomFieldsCSV(CUSTOM_FIELDS_CSV);
  } catch (error) {
    console.log(`   ⚠ Custom fields CSV not found, skipping validation`);
  }
  
  try {
    await fs.access(POST_TYPE_FIELDS_CSV);
    existingAttachments = await loadExistingAttachmentsCSV(POST_TYPE_FIELDS_CSV);
  } catch (error) {
    console.log(`   ⚠ Post type fields CSV not found, will check via API or assume empty`);
  }
  
  // Step 2: Build complete mapping: post_id -> post_type info
  console.log('\nBuilding complete post type mapping...');
  const completeMapping = new Map(); // post_id -> { post_type_id, post_type_slug, org_slug, org_id }
  let skippedPosts = 0;
  
  for (const [postId, fieldIds] of fieldUsage.entries()) {
    const postInfo = postsMapping.get(postId);
    if (!postInfo) {
      skippedPosts++;
      continue;
    }
    
    const postTypeInfo = postTypesMapping.get(postInfo.post_type_id);
    if (!postTypeInfo) {
      skippedPosts++;
      continue;
    }
    
    const orgSlug = getOrgSlugFromId(postInfo.organization_id);
    if (!orgSlug) {
      skippedPosts++;
      continue;
    }
    
    if (orgFilter && orgSlug !== orgFilter) continue;
    
    completeMapping.set(postId, {
      post_type_id: postInfo.post_type_id,
      post_type_slug: postTypeInfo.slug,
      org_slug: orgSlug,
      org_id: postInfo.organization_id,
    });
  }
  
  console.log(`   ✓ Mapped ${completeMapping.size} posts to post types`);
  if (skippedPosts > 0) {
    console.log(`   ⚠ Skipped ${skippedPosts} posts (not found in mapping CSVs)`);
  }
  
  if (completeMapping.size === 0) {
    console.error('\n❌ Error: Could not map any posts to post types.');
    console.error('   Check that CSV files are in the correct location and format.');
    return;
  }
  
  // Step 3: Group by post_type_id and custom_field_id
  console.log('\nGrouping field usage by post type...');
  const postTypeFieldUsage = new Map(); // post_type_id -> Map(custom_field_id -> count)
  const postTypeInfo = new Map(); // post_type_id -> { slug, org_slug, org_id }
  
  for (const [postId, fieldIds] of fieldUsage.entries()) {
    const mapping = completeMapping.get(postId);
    if (!mapping) continue;
    
    const postTypeId = mapping.post_type_id;
    
    if (!postTypeFieldUsage.has(postTypeId)) {
      postTypeFieldUsage.set(postTypeId, new Map());
      postTypeInfo.set(postTypeId, {
        slug: mapping.post_type_slug,
        org_slug: mapping.org_slug,
        org_id: mapping.org_id,
      });
    }
    
    for (const fieldId of fieldIds) {
      const count = postTypeFieldUsage.get(postTypeId).get(fieldId) || 0;
      postTypeFieldUsage.get(postTypeId).set(fieldId, count + 1);
    }
  }
  
  console.log(`   ✓ Found ${postTypeFieldUsage.size} post types with field usage`);
  
  // Step 4: Validate field IDs and check existing attachments
  console.log('\nValidating field IDs and checking existing attachments...');
  const missingAttachments = []; // Array of { post_type_id, custom_field_id, post_type_slug, org_slug, org_id, field_name, field_slug }
  let invalidFields = 0;
  let crossOrgIssues = 0;
  
  // If using SQL method, skip API check (SQL will use NOT EXISTS anyway)
  const skipApiCheck = method === 'sql';
  
  for (const [postTypeId, fieldUsageMap] of postTypeFieldUsage.entries()) {
    const info = postTypeInfo.get(postTypeId);
    const org = ORGANIZATIONS.find(o => o.slug === info.org_slug);
    const apiKey = org?.apiKey || options.apiKey;
    
    // Get existing attachments from CSV (if available) or API
    let existingFieldIds = new Set();
    
    // First, check CSV
    if (existingAttachments.has(postTypeId)) {
      existingFieldIds = existingAttachments.get(postTypeId);
    }
    
    // If CSV didn't have it and not using SQL, try API
    if (existingFieldIds.size === 0 && !skipApiCheck) {
      try {
        const apiAttachments = await getExistingAttachments(baseUrl, info.org_id, postTypeId, apiKey);
        existingFieldIds = new Set(apiAttachments.map(f => f.id || f.custom_field_id));
      } catch (error) {
        // If API check fails, assume all fields are missing (SQL will handle duplicates)
        console.warn(`   ⚠ Could not check existing attachments for ${info.slug} via API`);
      }
    }
    
    // Find missing attachments with validation
    for (const [customFieldId, count] of fieldUsageMap.entries()) {
      // Check if field exists in custom_fields CSV (optional - for validation and better reporting)
      const fieldInfo = customFieldsMapping.get(customFieldId);
      
      // If field not in CSV, we'll still include it (it exists in DB since it's in post_field_values)
      // But we can't validate organization isolation without the CSV
      if (fieldInfo) {
        // Validate organization isolation if we have the data
        if (fieldInfo.organization_id !== info.org_id) {
          crossOrgIssues++;
          console.warn(`   ⚠ Cross-org issue: Field ${customFieldId} belongs to org ${fieldInfo.organization_id}, but post type belongs to ${info.org_id}`);
          continue;
        }
      } else {
        // Field not in CSV - still include it but warn
        invalidFields++;
        // Don't skip - the field exists in DB (it's in post_field_values)
        // SQL will handle organization isolation via JOIN
      }
      
      // Check if already attached
      if (!existingFieldIds.has(customFieldId)) {
        missingAttachments.push({
          post_type_id: postTypeId,
          custom_field_id: customFieldId,
          post_type_slug: info.slug,
          org_slug: info.org_slug,
          org_id: info.org_id,
          field_name: fieldInfo?.name || 'unknown',
          field_slug: fieldInfo?.slug || 'unknown',
          usage_count: count,
        });
      }
    }
  }
  
  if (invalidFields > 0) {
    console.log(`   ⚠ ${invalidFields} fields not found in custom_fields CSV (will still be included - SQL will validate)`);
  }
  if (crossOrgIssues > 0) {
    console.log(`   ⚠ Found ${crossOrgIssues} cross-organizational issues (safely skipped)`);
  }
  
  // Step 5: Report findings
  console.log('\n============================================================');
  console.log('AUDIT REPORT');
  console.log('============================================================');
  
  const reportByOrg = new Map();
  for (const attachment of missingAttachments) {
    if (!reportByOrg.has(attachment.org_slug)) {
      reportByOrg.set(attachment.org_slug, new Map());
    }
    const orgReport = reportByOrg.get(attachment.org_slug);
    if (!orgReport.has(attachment.post_type_slug)) {
      orgReport.set(attachment.post_type_slug, []);
    }
    orgReport.get(attachment.post_type_slug).push(attachment);
  }
  
  for (const [orgSlug, postTypes] of reportByOrg.entries()) {
    console.log(`\nOrganization: ${orgSlug}`);
    
    for (const [postTypeSlug, attachments] of postTypes.entries()) {
      console.log(`  Post Type: ${postTypeSlug}`);
      console.log(`    - Missing attachments: ${attachments.length}`);
      if (attachments.length > 0 && attachments.length <= 10) {
        attachments.forEach(a => {
          const fieldName = a.field_name || 'unknown';
          const fieldSlug = a.field_slug || 'unknown';
          console.log(`      - ${fieldName} (${fieldSlug}) - ID: ${a.custom_field_id} - used ${a.usage_count} times`);
        });
      } else if (attachments.length > 10) {
        console.log(`      - First 10 fields:`);
        attachments.slice(0, 10).forEach(a => {
          const fieldName = a.field_name || 'unknown';
          const fieldSlug = a.field_slug || 'unknown';
          console.log(`        - ${fieldName} (${fieldSlug}) - ID: ${a.custom_field_id} - used ${a.usage_count} times`);
        });
        console.log(`      - ... and ${attachments.length - 10} more`);
      }
    }
  }
  
  const totalMissing = missingAttachments.length;
  console.log(`\nTotal missing attachments: ${totalMissing}`);
  
  if (totalMissing === 0) {
    console.log('\n✅ No missing attachments found!');
    return;
  }
  
  // Step 6: Fix
  if (dryRun) {
    console.log('\n⚠️  DRY RUN: Would fix the above missing attachments');
    return;
  }
  
  console.log('\n============================================================');
  console.log('FIXING MISSING ATTACHMENTS');
  console.log('============================================================');
  
  if (method === 'api') {
    await fixViaAPI(baseUrl, missingAttachments, options);
  } else if (method === 'sql') {
    await generateSQL(missingAttachments);
  }
}

/**
 * Fix via API
 */
async function fixViaAPI(baseUrl, missingAttachments, options = {}) {
  console.log(`\nFixing ${missingAttachments.length} missing attachments via API...`);
  
  // Group by post type for ordering
  const byPostType = new Map();
  for (const attachment of missingAttachments) {
    if (!byPostType.has(attachment.post_type_id)) {
      byPostType.set(attachment.post_type_id, []);
    }
    byPostType.get(attachment.post_type_id).push(attachment);
  }
  
  let totalAttached = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const [postTypeId, attachments] of byPostType.entries()) {
    const firstAttachment = attachments[0];
    const org = ORGANIZATIONS.find(o => o.slug === firstAttachment.org_slug);
    const apiKey = org?.apiKey || options.apiKey;
    
    console.log(`\n  Post Type: ${firstAttachment.post_type_slug} (${attachments.length} fields)`);
    
    let order = 1;
    for (const attachment of attachments) {
      try {
        const result = await attachFieldToPostType(
          baseUrl,
          attachment.org_id,
          attachment.post_type_id,
          attachment.custom_field_id,
          order,
          false,
          apiKey
        );
        
        if (result) {
          totalAttached++;
          console.log(`    ✓ Attached field ${attachment.custom_field_id} (order: ${order})`);
          order++;
        } else {
          totalSkipped++;
          console.log(`    ⏭️  Field ${attachment.custom_field_id} already attached, skipped`);
        }
      } catch (error) {
        totalErrors++;
        console.error(`    ✗ Failed to attach field ${attachment.custom_field_id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Fix complete:`);
  console.log(`   - Attached: ${totalAttached}`);
  console.log(`   - Skipped: ${totalSkipped}`);
  console.log(`   - Errors: ${totalErrors}`);
}

/**
 * Generate SQL to fix missing attachments
 */
async function generateSQL(missingAttachments) {
  console.log(`\nGenerating SQL for ${missingAttachments.length} missing attachments...`);
  
  const sqlStatements = [];
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Fix Missing Custom Field Attachments');
  sqlStatements.push('-- Generated from audit-and-fix-field-attachments.js');
  sqlStatements.push(`-- Total missing attachments: ${missingAttachments.length}`);
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('-- This SQL uses the actual post_field_values data to attach fields');
  sqlStatements.push('-- It includes safety checks to prevent duplicates and cross-org issues');
  sqlStatements.push('');
  
  // Group by organization
  const byOrg = new Map();
  for (const attachment of missingAttachments) {
    if (!byOrg.has(attachment.org_slug)) {
      byOrg.set(attachment.org_slug, []);
    }
    byOrg.get(attachment.org_slug).push(attachment);
  }
  
  for (const [orgSlug, attachments] of byOrg.entries()) {
    sqlStatements.push(`-- Organization: ${orgSlug}`);
    sqlStatements.push(`-- Missing attachments: ${attachments.length}`);
    sqlStatements.push('');
    
    // Group by post type
    const byPostType = new Map();
    for (const attachment of attachments) {
      if (!byPostType.has(attachment.post_type_slug)) {
        byPostType.set(attachment.post_type_slug, []);
      }
      byPostType.get(attachment.post_type_slug).push(attachment);
    }
    
    for (const [postTypeSlug, typeAttachments] of byPostType.entries()) {
      if (!typeAttachments || typeAttachments.length === 0) {
        console.warn(`⚠️  Skipping empty post type: ${postTypeSlug}`);
        continue;
      }
      
      sqlStatements.push(`-- Post Type: ${postTypeSlug} (${typeAttachments.length} fields)`);
      
      // Use simpler SQL without window functions (D1 compatible)
      // Insert one field at a time with sequential ordering
      sqlStatements.push(`-- Insert fields for ${postTypeSlug} (${typeAttachments.length} fields)`);
      sqlStatements.push(`-- Using simple INSERT with order = 1, will fix ordering in separate step if needed`);
      sqlStatements.push(`-- Optimized: No IN clause needed - join through post_field_values already filters to used fields`);
      sqlStatements.push(``);
      sqlStatements.push(`INSERT INTO post_type_fields (id, post_type_id, custom_field_id, is_required, "order", created_at)`);
      sqlStatements.push(`SELECT DISTINCT`);
      sqlStatements.push(`    lower(hex(randomblob(12))) AS id,`);
      sqlStatements.push(`    pt.id AS post_type_id,`);
      sqlStatements.push(`    cf.id AS custom_field_id,`);
      sqlStatements.push(`    0 AS is_required,`);
      sqlStatements.push(`    1 AS "order",  -- Will be updated in separate step`);
      sqlStatements.push(`    unixepoch() AS created_at`);
      sqlStatements.push(`FROM post_field_values pfv`);
      sqlStatements.push(`JOIN posts p ON pfv.post_id = p.id`);
      sqlStatements.push(`JOIN post_types pt ON p.post_type_id = pt.id`);
      sqlStatements.push(`JOIN organizations o ON pt.organization_id = o.id`);
      sqlStatements.push(`JOIN custom_fields cf ON pfv.custom_field_id = cf.id`);
      sqlStatements.push(`WHERE o.slug = '${orgSlug}'`);
      sqlStatements.push(`  AND pt.slug = '${postTypeSlug}'`);
      sqlStatements.push(`  AND o.id = cf.organization_id  -- Safety check: same organization`);
      sqlStatements.push(`  AND NOT EXISTS (`);
      sqlStatements.push(`    SELECT 1 FROM post_type_fields ptf`);
      sqlStatements.push(`    WHERE ptf.post_type_id = pt.id`);
      sqlStatements.push(`      AND ptf.custom_field_id = cf.id`);
      sqlStatements.push(`  );`);
      sqlStatements.push(``);
      sqlStatements.push('');
    }
  }
  
  // Write SQL file
  const sqlPath = path.join(__dirname, 'fix-missing-field-attachments.sql');
  const sqlContent = sqlStatements.join('\n');
  
  console.log(`\nWriting SQL file...`);
  console.log(`   SQL statements: ${sqlStatements.length}`);
  console.log(`   Content length: ${sqlContent.length} characters`);
  
  try {
    await fs.writeFile(sqlPath, sqlContent, 'utf-8');
    console.log(`\n✅ SQL file generated: ${sqlPath}`);
    console.log(`   Run it with: npx wrangler d1 execute omni-cms --remote --file=${sqlPath}`);
  } catch (error) {
    console.error(`\n❌ Error writing SQL file: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Script starting...');
  const args = process.argv.slice(2);
  console.log('Arguments:', args);
  
  const method = args.includes('--method=api') ? 'api' : 
                 args.includes('--method=sql') ? 'sql' : 'sql';
  const dryRun = args.includes('--dry-run');
  const useCSV = args.includes('--csv') || !args.includes('--api');
  const orgFilter = args.find(arg => arg.startsWith('--org='))?.split('=')[1] || null;
  
  const baseUrl = OMNI_CMS_BASE_URL;
  console.log('Configuration:', { method, dryRun, useCSV, orgFilter, baseUrl });
  
  if (useCSV) {
    try {
      await fs.access(POST_FIELD_VALUES_CSV);
      await fs.access(POSTS_CSV);
      await fs.access(POST_TYPES_CSV);
      
      // Custom fields and post_type_fields CSVs are optional but recommended
      console.log('\nNote: custom_fields.csv and post_type_fields.csv are optional but recommended for validation');
      
      await auditAndFixFromCSV(
        POST_FIELD_VALUES_CSV,
        POSTS_CSV,
        POST_TYPES_CSV,
        baseUrl,
        {
          method,
          dryRun,
          orgFilter,
        }
      );
    } catch (error) {
      console.error(`\n❌ Error: Could not access required CSV files:`);
      console.error(`   - ${POST_FIELD_VALUES_CSV}`);
      console.error(`   - ${POSTS_CSV}`);
      console.error(`   - ${POST_TYPES_CSV}`);
      console.error(`\n   ${error.message}`);
      console.error(`\n   Make sure all required CSV files exist in the db-28-11-2025 directory.`);
      console.error(`   Optional files (recommended): custom_fields.csv, post_type_fields.csv`);
      process.exit(1);
    }
  } else {
    console.error('API-based audit not yet implemented. Use --csv flag.');
    process.exit(1);
  }
}

main().catch(console.error);
