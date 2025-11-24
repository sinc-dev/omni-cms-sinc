/**
 * Import Post Types to Omni-CMS
 * 
 * Creates post types for each organization based on WordPress post types
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createPostType } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Post type definitions based on WordPress post types
const POST_TYPE_DEFINITIONS = {
  'study-in-kazakhstan': [
    { name: 'Blog', slug: 'blogs', description: 'Blog posts', icon: '📝', isHierarchical: false },
    { name: 'Program', slug: 'programs', description: 'Academic programs', icon: '🎓', isHierarchical: false },
    { name: 'University', slug: 'universities', description: 'Universities', icon: '🏛️', isHierarchical: false },
    { name: 'Team Member', slug: 'team-members', description: 'Team members', icon: '👤', isHierarchical: false },
    { name: 'Review', slug: 'reviews', description: 'Student reviews', icon: '⭐', isHierarchical: false },
    { name: 'Video Testimonial', slug: 'video-testimonials', description: 'Video testimonials', icon: '🎥', isHierarchical: false },
    { name: 'Dormitory', slug: 'dormitories', description: 'Student dormitories', icon: '🏠', isHierarchical: false },
  ],
  'study-in-north-cyprus': [
    { name: 'Blog', slug: 'blogs', description: 'Blog posts', icon: '📝', isHierarchical: false },
    { name: 'Program', slug: 'programs', description: 'Academic programs', icon: '🎓', isHierarchical: false },
    { name: 'University', slug: 'universities', description: 'Universities', icon: '🏛️', isHierarchical: false },
    { name: 'Team Member', slug: 'team-members', description: 'Team members', icon: '👤', isHierarchical: false },
    { name: 'Review', slug: 'reviews', description: 'Student reviews', icon: '⭐', isHierarchical: false },
    { name: 'Video Testimonial', slug: 'video-testimonials', description: 'Video testimonials', icon: '🎥', isHierarchical: false },
    { name: 'Dormitory', slug: 'dormitories', description: 'Student dormitories', icon: '🏠', isHierarchical: false },
  ],
  'paris-american-international-university': [
    { name: 'Blog', slug: 'blogs', description: 'Blog posts', icon: '📝', isHierarchical: false },
    { name: 'Program', slug: 'programs', description: 'Academic programs', icon: '🎓', isHierarchical: false },
    { name: 'Team Member', slug: 'team-members', description: 'Team members', icon: '👤', isHierarchical: false },
    { name: 'Academic Staff', slug: 'academic-staff', description: 'Academic staff members', icon: '👨‍🏫', isHierarchical: false },
    { name: 'Instructor', slug: 'instructors', description: 'Instructors', icon: '👩‍🏫', isHierarchical: false },
  ],
};

/**
 * Check if post type already exists
 */
async function getExistingPostTypes(baseUrl, orgId) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data) {
    return [];
  }

  return data.data;
}

/**
 * Import post types for an organization
 */
export async function importPostTypes(baseUrl, orgId, orgSlug) {
  const definitions = POST_TYPE_DEFINITIONS[orgSlug] || [];
  const postTypeMap = new Map(); // Maps slug -> post type ID

  // Get existing post types
  const existing = await getExistingPostTypes(baseUrl, orgId);
  const existingSlugs = new Set(existing.map(pt => pt.slug));

  for (const definition of definitions) {
    // Skip if already exists
    if (existingSlugs.has(definition.slug)) {
      const existingType = existing.find(pt => pt.slug === definition.slug);
      postTypeMap.set(definition.slug, existingType.id);
      console.log(`   ⏭️  Post type "${definition.name}" already exists (${existingType.id})`);
      continue;
    }

    try {
      const postType = await createPostType(baseUrl, orgId, definition);
      postTypeMap.set(definition.slug, postType.id);
      console.log(`   ✓ Created post type "${definition.name}" (${postType.id})`);
    } catch (error) {
      console.error(`   ✗ Failed to create post type "${definition.name}":`, error.message);
      throw error;
    }
  }

  // Save mapping for later use
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/post-types.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(postTypeMap), null, 2));

  return postTypeMap;
}

