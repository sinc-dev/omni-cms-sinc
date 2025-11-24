/**
 * Import Taxonomy Terms to Omni-CMS
 * 
 * Creates taxonomy terms (categories, tags, and custom taxonomy terms) with parent relationships
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createTaxonomyTerm } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Import taxonomy terms for an organization
 */
export async function importTaxonomyTerms(baseUrl, orgId, orgSlug, taxonomyMap) {
  const termMap = new Map(); // Maps "taxonomy-slug-wp-id" -> Omni-CMS term ID

  // Load taxonomy mappings
  const taxonomiesPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/raw-data/taxonomies.json`
  );
  const customTaxonomiesPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/raw-data/custom-taxonomies.json`
  );

  // Import standard taxonomies (categories and tags)
  try {
    const taxonomiesData = await fs.readFile(taxonomiesPath, 'utf-8');
    const taxonomies = JSON.parse(taxonomiesData);

    // Import categories
    if (taxonomies.categories && taxonomies.categories.length > 0) {
      const taxonomyId = taxonomyMap.get('categories');
      if (taxonomyId) {
        await importTermsForTaxonomy(
          baseUrl,
          orgId,
          taxonomyId,
          'categories',
          taxonomies.categories,
          termMap
        );
      }
    }

    // Import tags
    if (taxonomies.tags && taxonomies.tags.length > 0) {
      const taxonomyId = taxonomyMap.get('tags');
      if (taxonomyId) {
        await importTermsForTaxonomy(
          baseUrl,
          orgId,
          taxonomyId,
          'tags',
          taxonomies.tags,
          termMap
        );
      }
    }
  } catch (error) {
    console.warn(`   ⚠ Could not load standard taxonomies: ${error.message}`);
  }

  // Import custom taxonomies
  try {
    const customTaxonomiesData = await fs.readFile(customTaxonomiesPath, 'utf-8');
    const customTaxonomies = JSON.parse(customTaxonomiesData);

    for (const [taxonomySlug, terms] of Object.entries(customTaxonomies)) {
      if (!Array.isArray(terms) || terms.length === 0) continue;

      const taxonomyId = taxonomyMap.get(taxonomySlug);
      if (!taxonomyId) {
        console.warn(`   ⚠ Taxonomy "${taxonomySlug}" not found, skipping terms`);
        continue;
      }

      await importTermsForTaxonomy(
        baseUrl,
        orgId,
        taxonomyId,
        taxonomySlug,
        terms,
        termMap
      );
    }
  } catch (error) {
    console.warn(`   ⚠ Could not load custom taxonomies: ${error.message}`);
  }

  // Save mapping for later use
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/taxonomy-terms.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(termMap), null, 2));

  return termMap;
}

/**
 * Import terms for a specific taxonomy, handling parent relationships
 */
async function importTermsForTaxonomy(baseUrl, orgId, taxonomyId, taxonomySlug, terms, termMap) {
  // First, get existing terms
  const existingTerms = await getExistingTerms(baseUrl, orgId, taxonomyId);
  const existingSlugs = new Map(existingTerms.map(t => [t.slug, t.id]));

  // Sort terms: parents first (parent = 0), then children
  const sortedTerms = [...terms].sort((a, b) => {
    const aParent = a.parent || 0;
    const bParent = b.parent || 0;
    return aParent - bParent;
  });

  // Import terms in order (parents before children)
  for (const term of sortedTerms) {
    const key = `${taxonomySlug}-${term.id}`;
    
    // Skip if already exists
    if (existingSlugs.has(term.slug)) {
      const existingTerm = existingTerms.find(t => t.slug === term.slug);
      termMap.set(key, existingTerm.id);
      continue;
    }

    // Map parent ID if it exists
    let parentId = null;
    if (term.parent && term.parent > 0) {
      const parentKey = `${taxonomySlug}-${term.parent}`;
      parentId = termMap.get(parentKey);
      if (!parentId) {
        console.warn(`   ⚠ Parent term ${term.parent} not found for term ${term.id}, creating without parent`);
      }
    }

    try {
      const created = await createTaxonomyTerm(baseUrl, orgId, taxonomyId, {
        name: term.name,
        slug: term.slug,
        description: term.description || '',
        parent_id: parentId || null,
      });
      termMap.set(key, created.id);
    } catch (error) {
      console.error(`   ✗ Failed to create term "${term.name}":`, error.message);
      // Continue with other terms
    }
  }
}

/**
 * Get existing terms for a taxonomy
 */
async function getExistingTerms(baseUrl, orgId, taxonomyId) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomyId}`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data || !data.data.terms) {
    return [];
  }

  return data.data.terms;
}

