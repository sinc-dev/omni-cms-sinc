/**
 * Import Custom Fields to Omni-CMS
 * 
 * Analyzes custom fields from transformed data and creates custom field definitions
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createCustomField } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Infer field type from value
 */
function inferFieldType(value, fieldName) {
  if (value === null || value === undefined) {
    return 'text'; // Default to text if null
  }

  if (typeof value === 'boolean') {
    return 'boolean';
  }

  if (typeof value === 'number') {
    return 'number';
  }

  if (typeof value === 'string') {
    // Check if it's a media reference placeholder
    if (value.startsWith('wp-media-')) {
      return 'media';
    }

    // Check if it's a long text (likely textarea)
    if (value.length > 200) {
      return 'textarea';
    }

    // Check if it contains HTML
    if (value.includes('<') && value.includes('>')) {
      return 'rich_text';
    }

    // Check if it's a date string
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }

    // Default to text
    return 'text';
  }

  if (Array.isArray(value)) {
    // Check if array of media references
    if (value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('wp-media-')) {
      return 'media'; // Multiple media
    }
    return 'multi_select';
  }

  return 'text';
}

/**
 * Analyze custom fields from transformed data
 */
async function analyzeCustomFields(orgSlug) {
  const fieldDefinitions = new Map(); // Maps field slug -> { name, slug, field_type, settings }
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

      for (const post of posts) {
        if (!post.customFields) continue;

        for (const [fieldSlug, value] of Object.entries(post.customFields)) {
          if (!fieldDefinitions.has(fieldSlug)) {
            const fieldType = inferFieldType(value, fieldSlug);
            const fieldName = fieldSlug
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            // Convert slug to valid format (lowercase, underscores only)
            const validSlug = fieldSlug
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
              .replace(/_+/g, '_') // Replace multiple underscores with single
              .replace(/^_|_$/g, ''); // Remove leading/trailing underscores

            fieldDefinitions.set(fieldSlug, {
              name: fieldName,
              slug: validSlug,
              fieldType: fieldType, // Use camelCase for API
              settings: {},
            });
          }
        }
      }
    } catch (error) {
      // File doesn't exist - skip
    }
  }

  return fieldDefinitions;
}

/**
 * Get existing custom fields
 */
async function getExistingCustomFields(baseUrl, orgId) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/custom-fields`;
  const data = await apiRequest(url);
  
  if (!data.success || !data.data) {
    return [];
  }

  return data.data;
}

/**
 * Import custom fields for an organization
 */
export async function importCustomFields(baseUrl, orgId, orgSlug) {
  const customFieldMap = new Map(); // Maps field slug -> field ID

  // Analyze custom fields from transformed data
  console.log(`   Analyzing custom fields from transformed data...`);
  const fieldDefinitions = await analyzeCustomFields(orgSlug);
  console.log(`   Found ${fieldDefinitions.size} unique custom fields`);

  // Get existing custom fields
  const existing = await getExistingCustomFields(baseUrl, orgId);
  const existingSlugs = new Set(existing.map(f => f.slug.toLowerCase())); // Use lowercase for comparison
  
  // Debug: Log first few existing slugs if we have many fields to import
  if (fieldDefinitions.size > 0 && existing.length > 0) {
    console.log(`   Found ${existing.length} existing custom fields in database`);
  }

  // Create custom fields
  for (const [fieldSlug, definition] of fieldDefinitions) {
    // Skip if already exists (check by slug, case-insensitive)
    const normalizedSlug = definition.slug.toLowerCase();
    if (existingSlugs.has(normalizedSlug)) {
      const existingField = existing.find(f => f.slug.toLowerCase() === normalizedSlug);
      if (existingField) {
        customFieldMap.set(fieldSlug, existingField.id);
        console.log(`   ⏭️  Custom field "${definition.name}" already exists (${existingField.id})`);
        continue;
      }
    }

    try {
      const created = await createCustomField(baseUrl, orgId, definition);
      customFieldMap.set(fieldSlug, created.id);
      console.log(`   ✓ Created custom field "${definition.name}" (${created.id})`);
    } catch (error) {
      // If field already exists, fetch it and map it
      if (error.message && error.message.includes('already exists')) {
        // Re-fetch existing fields to get the one that matches
        const updatedExisting = await getExistingCustomFields(baseUrl, orgId);
        const normalizedSlug = definition.slug.toLowerCase();
        // Try to find by slug (case-insensitive)
        let matchingField = updatedExisting.find(f => 
          f.slug.toLowerCase() === normalizedSlug
        );
        // If not found, try to find by name (case-insensitive)
        if (!matchingField) {
          matchingField = updatedExisting.find(f => 
            f.name.toLowerCase() === definition.name.toLowerCase()
          );
        }
        // Last resort: try to find by original fieldSlug (case-insensitive)
        if (!matchingField && fieldSlug) {
          matchingField = updatedExisting.find(f => 
            f.slug.toLowerCase() === fieldSlug.toLowerCase()
          );
        }
        if (matchingField) {
          customFieldMap.set(fieldSlug, matchingField.id);
          console.log(`   ⏭️  Custom field "${definition.name}" already exists (${matchingField.id})`);
        } else {
          // Last resort: log warning but continue
          console.warn(`   ⚠ Custom field "${definition.name}" (slug: ${definition.slug}) already exists but could not be mapped`);
        }
      } else {
        console.error(`   ✗ Failed to create custom field "${definition.name}":`, error.message);
      }
      // Continue with other fields
    }
  }

  // Save mapping for later use
  const mappingPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/import-mappings/custom-fields.json`
  );
  await fs.mkdir(path.dirname(mappingPath), { recursive: true });
  await fs.writeFile(mappingPath, JSON.stringify(Object.fromEntries(customFieldMap), null, 2));

  return customFieldMap;
}

