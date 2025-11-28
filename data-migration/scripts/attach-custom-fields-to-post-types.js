/**
 * Attach Custom Fields to Post Types
 * 
 * This script analyzes which custom fields are used by which post types
 * and attaches them via the post_type_fields table.
 * 
 * This was the missing step from the original import process.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, getOrganizationId } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Attach a custom field to a post type via API
 */
async function attachFieldToPostType(baseUrl, orgId, postTypeId, customFieldId, order = 1, isRequired = false) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}/fields`;
  
  try {
    const data = await apiRequest(url, {
      method: 'POST',
      body: {
        custom_field_id: customFieldId,
        is_required: isRequired,
        order: order,
      },
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
 * Get existing field attachments for a post type
 */
async function getExistingAttachments(baseUrl, orgId, postTypeId) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types/${postTypeId}`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data) {
    return [];
  }
  
  // The post type response includes fields array
  return data.data.fields || [];
}

/**
 * Analyze which custom fields are used by which post types
 * by examining the transformed data
 */
async function analyzeFieldUsage(orgSlug) {
  const fieldUsage = new Map(); // postTypeSlug -> Set of custom field slugs
  
  const contentTypeDirs = ['blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories', 'academic-staff', 'instructors'];
  
  for (const contentType of contentTypeDirs) {
    const transformedPath = path.join(
      __dirname,
      `../organizations/${orgSlug}/transformed/${contentType}/transformed.json`
    );
    
    try {
      await fs.access(transformedPath);
      const content = await fs.readFile(transformedPath, 'utf-8');
      const posts = JSON.parse(content);
      
      if (!fieldUsage.has(contentType)) {
        fieldUsage.set(contentType, new Set());
      }
      
      for (const post of posts) {
        if (!post.customFields) continue;
        
        for (const fieldSlug of Object.keys(post.customFields)) {
          fieldUsage.get(contentType).add(fieldSlug);
        }
      }
    } catch (error) {
      // File doesn't exist - skip
    }
  }
  
  return fieldUsage;
}

/**
 * Attach custom fields to post types for an organization
 */
export async function attachCustomFieldsToPostTypes(baseUrl, orgId, orgSlug) {
  console.log(`\n   Attaching custom fields to post types for ${orgSlug}...`);
  
  // Load mappings
  const mappingsDir = path.join(__dirname, `../organizations/${orgSlug}/import-mappings`);
  
  let postTypeMap = new Map();
  let customFieldMap = new Map();
  
  try {
    const postTypesData = await fs.readFile(path.join(mappingsDir, 'post-types.json'), 'utf-8');
    Object.entries(JSON.parse(postTypesData)).forEach(([slug, id]) => {
      postTypeMap.set(slug, id);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load post type mappings: ${error.message}`);
    return;
  }
  
  try {
    const fieldsData = await fs.readFile(path.join(mappingsDir, 'custom-fields.json'), 'utf-8');
    Object.entries(JSON.parse(fieldsData)).forEach(([slug, id]) => {
      customFieldMap.set(slug, id);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load custom field mappings: ${error.message}`);
    return;
  }
  
  // Analyze which fields are used by which post types
  console.log(`   Analyzing custom field usage from transformed data...`);
  const fieldUsage = await analyzeFieldUsage(orgSlug);
  
  let totalAttached = 0;
  let totalSkipped = 0;
  
  // Attach fields to each post type
  for (const [postTypeSlug, fieldSlugs] of fieldUsage.entries()) {
    const postTypeId = postTypeMap.get(postTypeSlug);
    if (!postTypeId) {
      console.warn(`   ⚠ Post type "${postTypeSlug}" not found, skipping`);
      continue;
    }
    
    // Get existing attachments to avoid duplicates
    const existingAttachments = await getExistingAttachments(baseUrl, orgId, postTypeId);
    const existingFieldIds = new Set(existingAttachments.map(f => f.id || f.custom_field_id));
    
    console.log(`   Processing post type "${postTypeSlug}" (${fieldSlugs.size} fields)...`);
    
    let order = 1;
    let attachedCount = 0;
    let skippedCount = 0;
    
    // Sort field slugs for consistent ordering
    const sortedFieldSlugs = Array.from(fieldSlugs).sort();
    
    for (const fieldSlug of sortedFieldSlugs) {
      const customFieldId = customFieldMap.get(fieldSlug);
      if (!customFieldId) {
        console.warn(`   ⚠ Custom field "${fieldSlug}" not found in mappings, skipping`);
        skippedCount++;
        continue;
      }
      
      // Check if already attached
      if (existingFieldIds.has(customFieldId)) {
        skippedCount++;
        continue;
      }
      
      try {
        await attachFieldToPostType(baseUrl, orgId, postTypeId, customFieldId, order, false);
        console.log(`   ✓ Attached "${fieldSlug}" to "${postTypeSlug}" (order: ${order})`);
        attachedCount++;
        order++;
      } catch (error) {
        console.error(`   ✗ Failed to attach "${fieldSlug}" to "${postTypeSlug}": ${error.message}`);
        skippedCount++;
      }
    }
    
    totalAttached += attachedCount;
    totalSkipped += skippedCount;
    
    if (attachedCount > 0) {
      console.log(`   ✓ Attached ${attachedCount} fields to "${postTypeSlug}"`);
    }
    if (skippedCount > 0) {
      console.log(`   ⏭️  Skipped ${skippedCount} fields (already attached or not found)`);
    }
  }
  
  console.log(`   ✓ Total: ${totalAttached} fields attached, ${totalSkipped} skipped`);
  
  return {
    attached: totalAttached,
    skipped: totalSkipped,
  };
}
