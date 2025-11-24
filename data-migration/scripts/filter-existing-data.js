/**
 * Filter Existing Data
 * 
 * Queries the backend for all existing data and filters transformed data
 * to only include items that haven't been imported yet.
 * This dramatically reduces API calls by avoiding duplicate checks during import.
 */

import { apiRequest, getExistingPosts } from '../shared/utils/api-client.js';

/**
 * Get all existing post types
 */
async function getExistingPostTypes(baseUrl, orgId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data) {
    return [];
  }
  
  return Array.isArray(data.data) ? data.data : [data.data];
}

/**
 * Get all existing taxonomies
 */
async function getExistingTaxonomies(baseUrl, orgId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data) {
    return [];
  }
  
  return Array.isArray(data.data) ? data.data : [data.data];
}

/**
 * Get all existing terms for a taxonomy
 */
async function getExistingTermsForTaxonomy(baseUrl, orgId, taxonomyId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data || !data.data.terms) {
    return [];
  }
  
  return Array.isArray(data.data.terms) ? data.data.terms : [data.data.terms];
}

/**
 * Get all existing custom fields
 */
async function getExistingCustomFields(baseUrl, orgId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/custom-fields`;
  const data = await apiRequest(url, { apiKey });
  
  if (!data.success || !data.data) {
    return [];
  }
  
  return Array.isArray(data.data) ? data.data : [data.data];
}

/**
 * Filter existing data and build lookup maps
 * Returns maps/sets for fast filtering during import
 */
export async function filterExistingData(baseUrl, orgId, apiKey) {
  console.log('   Querying backend for existing data...');
  
  // Query all existing data in parallel
  const [postTypes, taxonomies, customFields] = await Promise.all([
    getExistingPostTypes(baseUrl, orgId, apiKey),
    getExistingTaxonomies(baseUrl, orgId, apiKey),
    getExistingCustomFields(baseUrl, orgId, apiKey),
  ]);
  
  // Build post type map: slug -> id
  const postTypeMap = new Map();
  postTypes.forEach(pt => {
    postTypeMap.set(pt.slug, pt.id);
  });
  
  // Build taxonomy map: slug -> id
  const taxonomyMap = new Map();
  taxonomies.forEach(t => {
    taxonomyMap.set(t.slug, t.id);
  });
  
  // Build custom field map: slug -> id (case-insensitive)
  const customFieldMap = new Map();
  customFields.forEach(f => {
    customFieldMap.set(f.slug.toLowerCase(), f.id);
  });
  
  // Get all terms for each taxonomy
  const termMap = new Map(); // Maps "taxonomySlug-termSlug" -> termId
  for (const taxonomy of taxonomies) {
    const terms = await getExistingTermsForTaxonomy(baseUrl, orgId, taxonomy.id, apiKey);
    terms.forEach(term => {
      const key = `${taxonomy.slug}-${term.slug}`;
      termMap.set(key, term.id);
    });
  }
  
  // Get all existing posts grouped by post type
  const existingPostsByType = new Map(); // Maps postTypeId -> Set of slugs
  for (const postType of postTypes) {
    const posts = await getExistingPosts(baseUrl, orgId, postType.id, apiKey);
    const slugs = new Set(posts.map(p => p.slug));
    existingPostsByType.set(postType.id, slugs);
    existingPostsByType.set(postType.slug, slugs); // Also index by slug for convenience
  }
  
  console.log(`   ✓ Found ${postTypes.length} post types, ${taxonomies.length} taxonomies, ${termMap.size} terms, ${customFields.length} custom fields`);
  console.log(`   ✓ Found ${Array.from(existingPostsByType.values()).reduce((sum, set) => sum + set.size, 0)} existing posts`);
  
  return {
    postTypeMap,
    taxonomyMap,
    termMap,
    customFieldMap,
    existingPostsByType,
  };
}

