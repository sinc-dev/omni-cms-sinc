/**
 * Media Mapping Utilities
 * 
 * Helps manage WordPress media ID to Omni-CMS media ID mappings
 * This will be updated after media files are uploaded to R2
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load media mapping file
 */
export async function loadMediaMapping(orgSlug) {
  const mappingPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/media/media-mapping.json`
  );
  
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    return new Map(Object.entries(JSON.parse(content)));
  } catch (error) {
    // Return empty map if file doesn't exist
    return new Map();
  }
}

/**
 * Save media mapping file
 */
export async function saveMediaMapping(orgSlug, mapping) {
  const mappingPath = path.join(
    __dirname,
    `../../organizations/${orgSlug}/raw-data/media/media-mapping.json`
  );
  
  const mappingObj = Object.fromEntries(mapping);
  await fs.writeFile(mappingPath, JSON.stringify(mappingObj, null, 2));
}

/**
 * Update media references in transformed data
 * This should be called after media upload to replace WordPress media IDs with Omni-CMS media IDs
 */
export async function updateMediaReferences(orgSlug, mediaMapping) {
  const transformedDir = path.join(
    __dirname,
    `../../organizations/${orgSlug}/transformed`
  );
  
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
    const filePath = path.join(transformedDir, contentType, 'transformed.json');
    
    try {
      await fs.access(filePath);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const posts = JSON.parse(content);
      
      let updated = false;
      const updatedPosts = posts.map(post => {
        const updatedPost = { ...post };
        
        // Update featuredImageId if it's a WordPress media placeholder
        if (updatedPost.featuredImageId && updatedPost.featuredImageId.startsWith('wp-media-')) {
          const wpMediaId = parseInt(updatedPost.featuredImageId.replace('wp-media-', ''));
          const omniMediaId = mediaMapping.get(wpMediaId);
          if (omniMediaId) {
            updatedPost.featuredImageId = omniMediaId;
            updated = true;
          }
        }
        
        // Update media IDs in customFields
        if (updatedPost.customFields) {
          const updatedCustomFields = { ...updatedPost.customFields };
          let customFieldsUpdated = false;
          
          Object.entries(updatedCustomFields).forEach(([key, value]) => {
            if (typeof value === 'string' && value.startsWith('wp-media-')) {
              const wpMediaId = parseInt(value.replace('wp-media-', ''));
              const omniMediaId = mediaMapping.get(wpMediaId);
              if (omniMediaId) {
                updatedCustomFields[key] = omniMediaId;
                customFieldsUpdated = true;
              }
            } else if (Array.isArray(value)) {
              const updatedArray = value.map(item => {
                if (typeof item === 'string' && item.startsWith('wp-media-')) {
                  const wpMediaId = parseInt(item.replace('wp-media-', ''));
                  const omniMediaId = mediaMapping.get(wpMediaId);
                  return omniMediaId || item;
                }
                return item;
              });
              if (JSON.stringify(updatedArray) !== JSON.stringify(value)) {
                updatedCustomFields[key] = updatedArray;
                customFieldsUpdated = true;
              }
            }
          });
          
          if (customFieldsUpdated) {
            updatedPost.customFields = updatedCustomFields;
            updated = true;
          }
        }
        
        return updatedPost;
      });
      
      if (updated) {
        await fs.writeFile(filePath, JSON.stringify(updatedPosts, null, 2));
        console.log(`  ✓ Updated media references in ${contentType}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`  ✗ Error updating ${contentType}:`, error.message);
      }
    }
  }
}

