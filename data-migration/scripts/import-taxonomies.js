/**
 * Import Taxonomies to Omni-CMS
 * 
 * Creates taxonomies (categories, tags, and custom taxonomies) for each organization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createTaxonomy } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get existing taxonomies
 */
async function getExistingTaxonomies(baseUrl, orgId) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data) {
    return [];
  }

  return data.data;
}

/**
 * Import taxonomies for an organization
 */
export async function importTaxonomies(baseUrl, orgId, orgSlug) {
  const taxonomyMap = new Map(); // Maps slug -> taxonomy ID

  // Standard taxonomies (categories and tags)
  const standardTaxonomies = [
    { name: 'Categories', slug: 'categories', isHierarchical: true },
    { name: 'Tags', slug: 'tags', isHierarchical: false },
  ];

  // Get custom taxonomies from fetched data
  const customTaxonomiesPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/raw-data/custom-taxonomies.json`
  );

  let customTaxonomySlugs = [];
  try {
    const customTaxonomiesData = await fs.readFile(customTaxonomiesPath, 'utf-8');
    const customTaxonomies = JSON.parse(customTaxonomiesData);
    customTaxonomySlugs = Object.keys(customTaxonomies).map(slug => ({
      name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      slug: slug,
      isHierarchical: false, // Most custom taxonomies are flat, but could be enhanced
    }));
  } catch (error) {
    console.warn(`   ⚠ Could not load custom taxonomies: ${error.message}`);
  }

  const allTaxonomies = [...standardTaxonomies, ...customTaxonomySlugs];

  // Get existing taxonomies
  const existing = await getExistingTaxonomies(baseUrl, orgId);
  const existingSlugs = new Set(existing.map(t => t.slug));

  for (const taxonomy of allTaxonomies) {
    // Skip if already exists
    if (existingSlugs.has(taxonomy.slug)) {
      const existingTaxonomy = existing.find(t => t.slug === taxonomy.slug);
      taxonomyMap.set(taxonomy.slug, existingTaxonomy.id);
      console.log(`   ⏭️  Taxonomy "${taxonomy.name}" already exists (${existingTaxonomy.id})`);
      continue;
    }

    try {
      const created = await createTaxonomy(baseUrl, orgId, {
        name: taxonomy.name,
        slug: taxonomy.slug,
        isHierarchical: taxonomy.isHierarchical,
      });
      taxonomyMap.set(taxonomy.slug, created.id);
      console.log(`   ✓ Created taxonomy "${taxonomy.name}" (${created.id})`);
    } catch (error) {
      console.error(`   ✗ Failed to create taxonomy "${taxonomy.name}":`, error.message);
      throw error;
    }
  }

  // Save mapping for later use
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/taxonomies.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(taxonomyMap), null, 2));

  return taxonomyMap;
}

