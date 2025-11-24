/**
 * Transform All WordPress Data to Omni-CMS Format
 * 
 * Main transformation script that processes all post types for an organization
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformBasePost } from './base-transformer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load media mapping from fetched media details
 */
async function loadMediaMap(orgSlug) {
  const mediaDetailsPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/media/media-details.json`
  );
  
  try {
    const content = await fs.readFile(mediaDetailsPath, 'utf-8');
    const mediaDetails = JSON.parse(content);
    
    // For now, we'll create a placeholder map
    // In the actual import, we'll map WordPress media IDs to Omni-CMS media IDs
    const map = new Map();
    
    // Store WordPress media IDs for later mapping
    // Initially use placeholder, but store full media details for upload
    mediaDetails.forEach((media) => {
      if (media.id) {
        // Placeholder: will be replaced with actual Omni-CMS media ID after upload
        // The import script will upload media and update this mapping
        map.set(media.id, `wp-media-${media.id}`);
      }
    });
    
    return map;
  } catch (error) {
    console.warn(`  ⚠ Could not load media map: ${error.message}`);
    return new Map();
  }
}

/**
 * Load taxonomy mapping from taxonomies.json
 * Also extracts custom taxonomies from posts
 */
async function loadTaxonomyMap(orgSlug) {
  const taxonomiesPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/taxonomies.json`
  );
  
  try {
    const content = await fs.readFile(taxonomiesPath, 'utf-8');
    const taxonomies = JSON.parse(content);
    
    const map = new Map();
    
    // Map categories (preserve parent relationships)
    if (taxonomies.categories) {
      taxonomies.categories.forEach((cat) => {
        if (cat.id) {
          // Store category data including parent for hierarchy preservation
          map.set(cat.id, {
            placeholder: `wp-category-${cat.id}`,
            name: cat.name,
            slug: cat.slug,
            parent: cat.parent || 0,
            taxonomy: 'category',
          });
        }
      });
    }
    
    // Map tags
    if (taxonomies.tags) {
      taxonomies.tags.forEach((tag) => {
        if (tag.id) {
          // Tags don't have hierarchies, but store for consistency
          map.set(tag.id, {
            placeholder: `wp-tag-${tag.id}`,
            name: tag.name,
            slug: tag.slug,
            parent: 0,
            taxonomy: 'tag',
          });
        }
      });
    }
    
    return map;
  } catch (error) {
    console.warn(`  ⚠ Could not load taxonomy map: ${error.message}`);
    return new Map();
  }
}

/**
 * Load custom taxonomy mapping from fetched custom-taxonomies.json
 * Maps WordPress taxonomy term IDs to placeholders (will be replaced with Omni-CMS IDs after import)
 */
async function loadCustomTaxonomyMap(orgSlug) {
  const map = new Map();
  
  const customTaxonomiesPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/custom-taxonomies.json`
  );
  
  try {
    await fs.access(customTaxonomiesPath);
    const content = await fs.readFile(customTaxonomiesPath, 'utf-8');
    const customTaxonomies = JSON.parse(content);
    
    // Map each taxonomy's terms
    Object.entries(customTaxonomies).forEach(([taxonomySlug, terms]) => {
      if (Array.isArray(terms)) {
        terms.forEach(term => {
          if (term.id) {
            const key = `${taxonomySlug}-${term.id}`;
            // Store term data for later use (name, slug, parent)
            map.set(key, {
              placeholder: `wp-taxonomy-${taxonomySlug}-${term.id}`,
              name: term.name,
              slug: term.slug,
              parent: term.parent || 0,
              taxonomy: taxonomySlug,
            });
          }
        });
      }
    });
  } catch (error) {
    // File doesn't exist - return empty map
    console.warn(`  ⚠ Could not load custom taxonomy map: ${error.message}`);
  }
  
  return map;
}

/**
 * Load author mapping from authors.json
 */
async function loadAuthorMap(orgSlug) {
  const authorsPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/authors.json`
  );
  
  try {
    const content = await fs.readFile(authorsPath, 'utf-8');
    const authors = JSON.parse(content);
    
    const map = new Map();
    
    if (Array.isArray(authors)) {
      authors.forEach((author) => {
        if (author.id) {
          // Placeholder: will be replaced with actual Omni-CMS user ID
          map.set(author.id, `wp-author-${author.id}`);
        }
      });
    }
    
    return map;
  } catch (error) {
    console.warn(`  ⚠ Could not load author map: ${error.message}`);
    return new Map();
  }
}

/**
 * Transform a single content type
 */
async function transformContentType(orgSlug, contentType, mappings) {
  const rawDataPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/${contentType}/raw.json`
  );
  const outputPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/transformed/${contentType}/transformed.json`
  );
  
  try {
    // Check if file exists
    await fs.access(rawDataPath);
    
    console.log(`  Transforming ${contentType}...`);
    
    const content = await fs.readFile(rawDataPath, 'utf-8');
    const wpPosts = JSON.parse(content);
    
    const transformed = wpPosts.map(wpPost =>
      transformBasePost(wpPost, mappings.mediaMap, mappings.taxonomyMap, mappings.authorMap, mappings.customTaxonomyMap)
    );
    
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Save transformed data
    await fs.writeFile(outputPath, JSON.stringify(transformed, null, 2));
    
    console.log(`    ✓ Transformed ${transformed.length} ${contentType}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - skip
      return;
    }
    console.error(`    ✗ Error transforming ${contentType}:`, error.message);
  }
}

/**
 * Transform all data for an organization
 */
async function transformOrganization(orgSlug) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Transforming: ${orgSlug}`);
  console.log('='.repeat(60));
  
  // Load mappings
  console.log('  Loading mappings...');
  const mediaMap = await loadMediaMap(orgSlug);
  const taxonomyMap = await loadTaxonomyMap(orgSlug);
  const customTaxonomyMap = await loadCustomTaxonomyMap(orgSlug);
  const authorMap = await loadAuthorMap(orgSlug);
  
  console.log(`    Media: ${mediaMap.size} items`);
  console.log(`    Taxonomies: ${taxonomyMap.size} items`);
  console.log(`    Custom Taxonomies: ${customTaxonomyMap.size} items`);
  console.log(`    Authors: ${authorMap.size} items`);
  
  const mappings = { mediaMap, taxonomyMap, customTaxonomyMap, authorMap };
  
  // Transform all content types
  const contentTypes = [
    'blogs',
    'programs',
    'universities',
    'team-members',
    'reviews',
    'video-testimonials',
    'academic-staff',
    'instructors',
    'dormitories',
  ];
  
  for (const contentType of contentTypes) {
    await transformContentType(orgSlug, contentType, mappings);
  }
  
  console.log(`\n  ✓ Transformation complete for ${orgSlug}`);
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('WordPress to Omni-CMS Data Transformation');
  console.log('='.repeat(60));
  
  const organizations = [
    'study-in-kazakhstan',
    'study-in-north-cyprus',
    'paris-american-international-university',
  ];
  
  for (const orgSlug of organizations) {
    await transformOrganization(orgSlug);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✓ All transformations complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

