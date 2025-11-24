/**
 * Import Posts to Omni-CMS
 * 
 * Imports all posts (blogs, programs, universities, etc.) with all relationships
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPost, getExistingPosts } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load mappings
 */
async function loadMappings(orgSlug) {
  const mappingsDir = path.join(__dirname, `../organizations/${orgSlug}/import-mappings`);

  const postTypeMap = new Map();
  const termMap = new Map();
  const customFieldMap = new Map();
  const mediaMap = new Map();

  try {
    const postTypesData = await fs.readFile(path.join(mappingsDir, 'post-types.json'), 'utf-8');
    Object.entries(JSON.parse(postTypesData)).forEach(([slug, id]) => {
      postTypeMap.set(slug, id);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load post type mappings: ${error.message}`);
  }

  try {
    const termsData = await fs.readFile(path.join(mappingsDir, 'taxonomy-terms.json'), 'utf-8');
    Object.entries(JSON.parse(termsData)).forEach(([key, id]) => {
      termMap.set(key, id);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load taxonomy term mappings: ${error.message}`);
  }

  try {
    const fieldsData = await fs.readFile(path.join(mappingsDir, 'custom-fields.json'), 'utf-8');
    Object.entries(JSON.parse(fieldsData)).forEach(([slug, id]) => {
      customFieldMap.set(slug, id);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load custom field mappings: ${error.message}`);
  }

  try {
    const mediaData = await fs.readFile(path.join(mappingsDir, 'media.json'), 'utf-8');
    Object.entries(JSON.parse(mediaData)).forEach(([wpId, omniId]) => {
      mediaMap.set(parseInt(wpId), omniId);
    });
  } catch (error) {
    console.warn(`   ⚠ Could not load media mappings: ${error.message}`);
  }

  return { postTypeMap, termMap, customFieldMap, mediaMap };
}

/**
 * Map taxonomy IDs from transformed data
 */
function mapTaxonomyIds(customTaxonomyIds, termMap) {
  const taxonomies = {};
  
  if (!customTaxonomyIds) return taxonomies;

  for (const [taxonomySlug, termPlaceholders] of Object.entries(customTaxonomyIds)) {
    const mappedTerms = termPlaceholders
      .map(placeholder => termMap.get(placeholder))
      .filter(id => id); // Remove undefined values

    if (mappedTerms.length > 0) {
      taxonomies[taxonomySlug] = mappedTerms;
    }
  }

  return taxonomies;
}

/**
 * Map custom fields with media IDs
 */
function mapCustomFields(customFields, customFieldMap, mediaMap) {
  if (!customFields) return {};

  const mapped = {};
  
  for (const [fieldSlug, value] of Object.entries(customFields)) {
    const fieldId = customFieldMap.get(fieldSlug);
    if (!fieldId) continue;

    // Map media IDs in custom fields
    if (typeof value === 'string' && value.startsWith('wp-media-')) {
      const wpMediaId = parseInt(value.replace('wp-media-', ''));
      const mappedMediaId = mediaMap.get(wpMediaId);
      // Only set if media was successfully mapped, otherwise skip (don't set invalid placeholder)
      if (mappedMediaId) {
        mapped[fieldId] = mappedMediaId;
      }
      // If media not found, skip this field (don't set invalid "wp-media-123" value)
    } else if (Array.isArray(value)) {
      const mappedArray = value
        .map(item => {
          if (typeof item === 'string' && item.startsWith('wp-media-')) {
            const wpMediaId = parseInt(item.replace('wp-media-', ''));
            return mediaMap.get(wpMediaId); // Returns undefined if not found
          }
          return item;
        })
        .filter(item => item !== undefined); // Remove undefined values
      
      // Only set if array has valid items
      if (mappedArray.length > 0) {
        mapped[fieldId] = mappedArray;
      }
    } else {
      mapped[fieldId] = value;
    }
  }

  return mapped;
}

/**
 * Import posts for a content type
 */
async function importContentType(baseUrl, orgId, orgSlug, contentType, mappings, testLimit = null, apiKey = null) {
  const { postTypeMap, termMap, customFieldMap, mediaMap } = mappings;
  const postMap = new Map();

  const transformedPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/transformed/${contentType}/transformed.json`
  );

  try {
    await fs.access(transformedPath);
  } catch {
    return postMap; // File doesn't exist
  }

  const content = await fs.readFile(transformedPath, 'utf-8');
  let posts = JSON.parse(content);

  // Apply test limit if provided
  if (testLimit && posts.length > testLimit) {
    console.log(`   ⚠ TEST MODE: Limiting ${contentType} from ${posts.length} to ${testLimit} records`);
    posts = posts.slice(0, testLimit);
  }

  const postTypeId = postTypeMap.get(contentType);
  if (!postTypeId) {
    console.warn(`   ⚠ Post type "${contentType}" not found, skipping`);
    return postMap;
  }

  console.log(`   Importing ${posts.length} ${contentType}...`);

  // Get existing posts for this post type to avoid duplicates
  const existingPosts = await getExistingPosts(baseUrl, orgId, postTypeId, apiKey);
  const existingSlugs = new Set(existingPosts.map(p => p.slug));

  const BATCH_SIZE = 20;
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (post) => {
      try {
        // Skip if post already exists
        if (existingSlugs.has(post.slug)) {
          const existingPost = existingPosts.find(p => p.slug === post.slug);
          if (existingPost) {
            postMap.set(post.metadata.wordpressId, existingPost.id);
            skipped++;
            return;
          }
        }
        // Map featured image
        let featuredImageId = null;
        if (post.featuredImageId) {
          if (typeof post.featuredImageId === 'string' && post.featuredImageId.startsWith('wp-media-')) {
            const wpMediaId = parseInt(post.featuredImageId.replace('wp-media-', ''));
            featuredImageId = mediaMap.get(wpMediaId);
          } else {
            featuredImageId = post.featuredImageId;
          }
        }

        // Map taxonomies
        const taxonomies = {
          categories: post.categoryIds?.map(id => termMap.get(`categories-${id}`) || id).filter(Boolean) || [],
          tags: post.tagIds?.map(id => termMap.get(`tags-${id}`) || id).filter(Boolean) || [],
          ...mapTaxonomyIds(post.customTaxonomyIds, termMap),
        };

        // Map custom fields
        const customFields = mapCustomFields(post.customFields, customFieldMap, mediaMap);

        // Create post
        const postData = {
          postTypeId,
          title: post.title,
          slug: post.slug,
          content: post.content || '',
          excerpt: post.excerpt || null,
          status: post.status || 'draft',
          featuredImageId: featuredImageId || undefined,
          taxonomies: Object.keys(taxonomies).length > 0 ? taxonomies : undefined,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
          createdAt: post.createdAt, // Unix timestamp from WordPress
          updatedAt: post.updatedAt, // Unix timestamp from WordPress
          publishedAt: post.publishedAt, // Unix timestamp from WordPress
        };

        // Validate postTypeId exists
        if (!postTypeId) {
          throw new Error(`Post type ID not found for "${contentType}"`);
        }

        // Validate taxonomy term IDs exist (check first few)
        const invalidTaxonomyTerms = [];
        for (const [taxonomySlug, termIds] of Object.entries(taxonomies)) {
          if (Array.isArray(termIds)) {
            for (const termId of termIds.slice(0, 3)) { // Check first 3
              if (termId && typeof termId === 'string' && !termId.match(/^[a-zA-Z0-9_-]+$/)) {
                invalidTaxonomyTerms.push(`${taxonomySlug}:${termId}`);
              }
            }
          }
        }

        const created = await createPost(baseUrl, orgId, postData, apiKey);
        postMap.set(post.metadata.wordpressId, created.id);
        existingSlugs.add(post.slug); // Add to set to avoid duplicates in same batch
        imported++;

        if (imported % 50 === 0) {
          console.log(`     Progress: ${imported}/${posts.length} imported`);
        }
      } catch (error) {
        // Check if it's a duplicate error
        if (error.message && error.message.includes('UNIQUE constraint')) {
          console.warn(`     ⏭️  Post "${post.title}" already exists, skipping`);
          skipped++;
        } else {
          const errorMsg = error.message || String(error);
          // Extract more details from error message for foreign key errors
          let detailedError = errorMsg;
          if (errorMsg.includes('FOREIGN KEY') || errorMsg.includes('SQLITE_CONSTRAINT')) {
            const taxKeys = Object.keys(taxonomies || {});
            const customFieldKeys = Object.keys(customFields || {});
            detailedError = `${errorMsg}\n       Details: PostTypeId=${postTypeId}, Slug=${post.slug}, Taxonomies=[${taxKeys.join(', ')}], CustomFields=[${customFieldKeys.join(', ')}]`;
          }
          console.error(`     ✗ Failed to import post "${post.title}":`, detailedError);
          failed++;
        }
      }
    }));

    // Small delay between batches
    if (i + BATCH_SIZE < posts.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`   ✓ Imported ${imported} ${contentType} (${skipped} skipped, ${failed} failed)`);
  return postMap;
}

/**
 * Import posts for an organization
 */
export async function importPosts(baseUrl, orgId, orgSlug, postTypeMap, termMap, customFieldMap, mediaMap, testLimit = null, apiKey = null) {
  const allPostMap = new Map(); // Maps WordPress post ID -> Omni-CMS post ID

  // Load all mappings
  const mappings = await loadMappings(orgSlug);
  
  // Merge with provided mappings (in case they're more up-to-date)
  mappings.postTypeMap = new Map([...mappings.postTypeMap, ...postTypeMap]);
  mappings.termMap = new Map([...mappings.termMap, ...termMap]);
  mappings.customFieldMap = new Map([...mappings.customFieldMap, ...customFieldMap]);
  mappings.mediaMap = new Map([...mappings.mediaMap, ...mediaMap]);

  // Import each content type
  const contentTypes = ['blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories', 'academic-staff', 'instructors'];

  for (const contentType of contentTypes) {
    const contentTypeMap = await importContentType(baseUrl, orgId, orgSlug, contentType, mappings, testLimit, apiKey);
    for (const [wpId, omniId] of contentTypeMap) {
      allPostMap.set(wpId, omniId);
    }
  }

  // Save mapping
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/posts.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(allPostMap), null, 2));

  return allPostMap;
}

