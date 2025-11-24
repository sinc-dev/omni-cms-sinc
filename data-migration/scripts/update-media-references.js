/**
 * Update Media References in Posts
 * 
 * Scans posts for missing media references and updates them if media has been uploaded
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load media mapping
 */
async function loadMediaMap(orgSlug) {
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/media.json`
  );

  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const mediaMapData = JSON.parse(content);
    return new Map(Object.entries(mediaMapData).map(([wpId, omniId]) => [parseInt(wpId), omniId]));
  } catch (error) {
    console.warn(`   ⚠ Could not load media mapping: ${error.message}`);
    return new Map();
  }
}

/**
 * Load post mapping
 */
async function loadPostMap(orgSlug) {
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/posts.json`
  );

  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const postMapData = JSON.parse(content);
    return new Map(Object.entries(postMapData));
  } catch (error) {
    console.warn(`   ⚠ Could not load post mapping: ${error.message}`);
    return new Map();
  }
}

/**
 * Load transformed posts to get original media references
 */
async function loadTransformedPosts(orgSlug) {
  const contentTypeDirs = ['blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories', 'academic-staff', 'instructors'];
  const allPosts = [];

  for (const contentType of contentTypeDirs) {
    const transformedPath = path.join(
      __dirname,
      `../organizations/${orgSlug}/transformed/${contentType}/transformed.json`
    );

    try {
      const content = await fs.readFile(transformedPath, 'utf-8');
      const posts = JSON.parse(content);
      allPosts.push(...posts);
    } catch (error) {
      // File doesn't exist - skip
    }
  }

  return allPosts;
}

/**
 * Extract media references from custom fields
 */
function extractMediaReferences(customFields) {
  const mediaRefs = [];

  if (!customFields) return mediaRefs;

  for (const [fieldSlug, value] of Object.entries(customFields)) {
    if (typeof value === 'string' && value.startsWith('wp-media-')) {
      const wpMediaId = parseInt(value.replace('wp-media-', ''));
      mediaRefs.push({ fieldSlug, wpMediaId, value });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string' && item.startsWith('wp-media-')) {
          const wpMediaId = parseInt(item.replace('wp-media-', ''));
          mediaRefs.push({ fieldSlug, wpMediaId, value: item, arrayIndex: index });
        }
      });
    }
  }

  return mediaRefs;
}

/**
 * Update a post's media references
 */
async function updatePostMediaReferences(baseUrl, orgId, postId, updates, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts/${postId}`;
  
  try {
    const data = await apiRequest(url, {
      method: 'PATCH',
      body: updates,
      apiKey,
    });

    if (!data.success) {
      throw new Error(data.error?.message || data.message || 'Unknown error');
    }

    return data.data;
  } catch (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }
}

/**
 * Update media references for an organization
 */
export async function updateMediaReferences(baseUrl, orgId, orgSlug, apiKey) {
  console.log(`   Scanning posts for missing media references...`);

  // Load mappings
  const mediaMap = await loadMediaMap(orgSlug);
  const postMap = await loadPostMap(orgSlug);
  const transformedPosts = await loadTransformedPosts(orgSlug);

  if (mediaMap.size === 0) {
    console.log(`   ⚠ No media mapping found, skipping media reference updates`);
    return;
  }

  if (postMap.size === 0) {
    console.log(`   ⚠ No posts found, skipping media reference updates`);
    return;
  }

  console.log(`   Found ${mediaMap.size} media items and ${postMap.size} posts to check`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Process posts in batches
  const BATCH_SIZE = 20;
  const postsToCheck = transformedPosts.filter(post => postMap.has(post.metadata.wordpressId));

  for (let i = 0; i < postsToCheck.length; i += BATCH_SIZE) {
    const batch = postsToCheck.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (post) => {
      try {
        const wpPostId = post.metadata.wordpressId;
        const omniPostId = postMap.get(wpPostId);
        
        if (!omniPostId) {
          skipped++;
          return;
        }

        const updates = {};
        let hasUpdates = false;

        // Check featured image
        if (post.featuredImageId) {
          if (typeof post.featuredImageId === 'string' && post.featuredImageId.startsWith('wp-media-')) {
            const wpMediaId = parseInt(post.featuredImageId.replace('wp-media-', ''));
            const omniMediaId = mediaMap.get(wpMediaId);
            if (omniMediaId) {
              updates.featuredImageId = omniMediaId;
              hasUpdates = true;
            }
          }
        }

        // Check custom fields for media references
        const mediaRefs = extractMediaReferences(post.customFields);
        if (mediaRefs.length > 0) {
          // We need to get the post first to see current custom field values
          // Then update only the fields that have missing media
          // For now, we'll update all custom fields that have media references
          // This is a simplified approach - in production you might want to fetch the post first
          
          // Load custom field mapping
          const customFieldMapPath = path.join(
            __dirname,
            `../organizations/${orgSlug}/import-mappings/custom-fields.json`
          );
          
          let customFieldMap = new Map();
          try {
            const customFieldData = await fs.readFile(customFieldMapPath, 'utf-8');
            const customFieldMapData = JSON.parse(customFieldData);
            customFieldMap = new Map(Object.entries(customFieldMapData));
          } catch (error) {
            // Custom fields mapping not found - skip custom field updates
          }

          if (customFieldMap.size > 0) {
            const customFieldUpdates = {};
            
            for (const ref of mediaRefs) {
              const fieldId = customFieldMap.get(ref.fieldSlug);
              if (!fieldId) continue;

              const omniMediaId = mediaMap.get(ref.wpMediaId);
              if (!omniMediaId) continue;

              if (ref.arrayIndex !== undefined) {
                // Array field - we'd need to fetch current value and update array
                // For now, skip array updates (would require fetching post first)
                continue;
              } else {
                // Single media field
                customFieldUpdates[fieldId] = omniMediaId;
                hasUpdates = true;
              }
            }

            if (Object.keys(customFieldUpdates).length > 0) {
              updates.customFields = customFieldUpdates;
            }
          }
        }

        // Update post if we have changes
        if (hasUpdates) {
          await updatePostMediaReferences(baseUrl, orgId, omniPostId, updates, apiKey);
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`   ✗ Failed to update media references for post ${post.title}:`, error.message);
        failed++;
      }
    }));

    if (updated % 50 === 0 && updated > 0) {
      console.log(`     Progress: ${updated} posts updated`);
    }
  }

  console.log(`   ✓ Updated ${updated} posts with media references (${skipped} skipped, ${failed} failed)`);
}

