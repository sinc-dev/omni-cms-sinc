/**
 * Base Transformer Utilities
 * Common functions for transforming WordPress data to Omni-CMS format
 */

/**
 * Map WordPress status to Omni-CMS status
 */
export function mapStatus(wpStatus) {
  switch (wpStatus) {
    case 'publish':
      return 'published';
    case 'draft':
    case 'pending':
    case 'future':
      return 'draft';
    case 'private':
    case 'trash':
      return 'archived';
    default:
      return 'draft';
  }
}

/**
 * Map WordPress media ID to Omni-CMS media ID
 */
export function mapMediaId(wpMediaId, mediaMap) {
  if (!wpMediaId) return undefined;
  const id = typeof wpMediaId === 'string' ? parseInt(wpMediaId) : wpMediaId;
  if (id <= 0) return undefined;
  return mediaMap.get(id);
}

/**
 * Map WordPress taxonomy IDs to Omni-CMS taxonomy term IDs
 * Handles both simple placeholder strings and objects with term data
 */
export function mapTaxonomyIds(wpIds, taxonomyMap) {
  if (!wpIds || !Array.isArray(wpIds)) return [];
  return wpIds
    .map(id => {
      const termData = taxonomyMap.get(id);
      // Handle both old format (string) and new format (object)
      if (typeof termData === 'string') {
        return termData;
      }
      return termData?.placeholder;
    })
    .filter(id => Boolean(id));
}

/**
 * Map WordPress author ID to Omni-CMS user ID
 */
export function mapAuthorId(wpAuthorId, authorMap) {
  if (!wpAuthorId) return undefined;
  return authorMap.get(wpAuthorId);
}

/**
 * Extract custom fields from WordPress meta
 * Filters out WordPress internal fields and JetEngine internal fields
 */
export function extractCustomFields(meta) {
  if (!meta) return {};
  
  const customFields = {};
  const excludeFields = [
    'content-type',
    '_jet_sm_ready_style',
    '_jet_sm_style',
    '_jet_sm_controls_values',
    '_jet_sm_fonts_collection',
    '_jet_sm_fonts_links',
    'footnotes',
    'hs_createdate',
    'hs_lastmodifieddate',
    'hs_object_id',
  ];
  
  Object.entries(meta).forEach(([key, value]) => {
    // Skip internal WordPress/JetEngine fields
    if (excludeFields.includes(key) || key.startsWith('_')) {
      return;
    }
    
    // Skip empty strings and null values
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return;
    }
    
    // Only convert media IDs if the field name suggests it's a media field
    const mediaFieldNames = ['logo', 'image', 'photo', 'thumbnail', 'avatar', 'background', 'gallery', 'media', 'attachment', 'picture', 'banner'];
    const isMediaField = mediaFieldNames.some(name => key.toLowerCase().includes(name));
    
    // Convert media ID arrays to placeholders for later mapping
    if (Array.isArray(value) && value.length > 0 && isMediaField) {
      // Check if it's an array of media IDs (all numeric strings)
      const isMediaIdArray = value.every(
        item => typeof item === 'string' && /^\d+$/.test(item)
      );
      if (isMediaIdArray) {
        // Convert to placeholders
        customFields[key] = value.map(id => `wp-media-${id}`);
        return;
      }
    }
    
    // Convert single media ID strings to placeholders for later mapping
    if (typeof value === 'string' && /^\d+$/.test(value) && parseInt(value) > 0 && isMediaField) {
      customFields[key] = `wp-media-${value}`;
      return;
    }
    
    // For numeric strings that are NOT media fields, convert to numbers if small (likely counts/durations)
    // Keep as strings if large (likely IDs)
    if (typeof value === 'string' && /^\d+$/.test(value) && parseInt(value) > 0 && !isMediaField) {
      const numValue = parseInt(value);
      // Convert to number if it's a small value (likely a count/duration), keep as string if large (likely an ID)
      customFields[key] = numValue < 1000 ? numValue : value;
      return;
    }
    
    customFields[key] = value;
  });
  
  return customFields;
}

/**
 * Map media IDs in custom fields
 */
export function mapCustomFieldsMedia(customFields, mediaMap) {
  const mapped = {};
  
  Object.entries(customFields).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // Map array of media IDs (could be placeholders like "wp-media-123" or actual IDs)
      mapped[key] = value
        .map((id) => {
          // Handle placeholder format "wp-media-123"
          if (typeof id === 'string' && id.startsWith('wp-media-')) {
            const wpMediaId = parseInt(id.replace('wp-media-', ''));
            return mediaMap.get(wpMediaId) || id;
          }
          // Handle numeric IDs
          const numId = typeof id === 'string' ? parseInt(id) : id;
          if (typeof numId === 'number' && numId > 0) {
            return mediaMap.get(numId) || id;
          }
          return id;
        })
        .filter((id) => id !== null && id !== undefined);
    } else if (typeof value === 'string' && value.startsWith('wp-media-')) {
      // Handle placeholder format "wp-media-123"
      const wpMediaId = parseInt(value.replace('wp-media-', ''));
      mapped[key] = mediaMap.get(wpMediaId) || value;
    } else if (typeof value === 'number' && value > 0) {
      // Map single numeric media ID
      mapped[key] = mapMediaId(value, mediaMap) || value;
    } else {
      mapped[key] = value;
    }
  });
  
  return mapped;
}

/**
 * Convert WordPress date string to Unix timestamp (seconds)
 * Validates date before conversion
 */
function dateToUnixTimestamp(dateString) {
  if (!dateString) return undefined;
  
  // Validate date string format
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return undefined;
  }
  
  return Math.floor(date.getTime() / 1000);
}

/**
 * Sanitize and validate slug
 * Ensures slug is URL-safe and valid for Omni-CMS
 */
function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return 'untitled';
  }
  
  // Remove leading/trailing whitespace
  let sanitized = slug.trim();
  
  // Convert to lowercase
  sanitized = sanitized.toLowerCase();
  
  // Replace spaces and underscores with hyphens
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  
  // Remove special characters except hyphens and alphanumeric
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  
  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Ensure slug is not empty
  if (!sanitized) {
    return 'untitled';
  }
  
  // Limit length (typical database limit is 255, but slugs should be shorter)
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
    // Remove trailing hyphen if truncated
    sanitized = sanitized.replace(/-+$/, '');
  }
  
  return sanitized;
}

/**
 * Extract relationship data from WordPress post meta
 */
function extractRelationships(wpPost, postType) {
  const relationships = {};
  
  if (!wpPost.meta) return relationships;
  
  // Programs → Universities relationship
  if (postType === 'programs' && wpPost.meta.associated_university_name) {
    relationships.university = {
      type: 'university',
      wordpressName: wpPost.meta.associated_university_name,
      wordpressHubspotId: wpPost.meta.associated_university_hubspot_id || null,
    };
  }
  
  // Reviews → Universities relationship (if exists)
  if (postType === 'reviews' && wpPost.meta.university_name) {
    relationships.university = {
      type: 'university',
      wordpressName: wpPost.meta.university_name,
    };
  }
  
  return Object.keys(relationships).length > 0 ? relationships : undefined;
}

/**
 * Extract custom taxonomy IDs from WordPress post
 * WordPress stores custom taxonomies as arrays of term IDs on the post object
 */
function extractCustomTaxonomies(wpPost) {
  const customTaxonomies = {};
  
  // List of known custom taxonomy field names
  const customTaxonomyFields = [
    'program-degree-level',
    'program-languages',
    'program_durations',
    'program_study_formats',
    'disciplines',
    'location',
    'dormitory-category',
    'price-format',
    'currency',
    'room-type',
    'institution--residence-name',
  ];
  
  customTaxonomyFields.forEach(fieldName => {
    if (wpPost[fieldName] && Array.isArray(wpPost[fieldName]) && wpPost[fieldName].length > 0) {
      customTaxonomies[fieldName] = wpPost[fieldName];
    }
  });
  
  return Object.keys(customTaxonomies).length > 0 ? customTaxonomies : undefined;
}

/**
 * Base transformer for WordPress posts
 */
export function transformBasePost(wpPost, mediaMap, taxonomyMap, authorMap, customTaxonomyMap = new Map()) {
  const customFields = extractCustomFields(wpPost.meta);
  const mappedCustomFields = mapCustomFieldsMedia(customFields, mediaMap);
  
  // Extract relationship data (for later import)
  const relationships = extractRelationships(wpPost, wpPost.type);
  
  // Extract custom taxonomies
  const customTaxonomies = extractCustomTaxonomies(wpPost);
  
  // Map custom taxonomy IDs to Omni-CMS taxonomy term IDs
  const mappedCustomTaxonomies = customTaxonomies ? Object.fromEntries(
    Object.entries(customTaxonomies).map(([taxonomyName, termIds]) => [
      taxonomyName,
      termIds.map(id => {
        const termData = customTaxonomyMap.get(`${taxonomyName}-${id}`);
        return termData?.placeholder || `wp-taxonomy-${taxonomyName}-${id}`;
      })
    ])
  ) : undefined;
  
  // Use GMT dates for consistency (WordPress provides both local and GMT)
  // Convert to Unix timestamps (seconds since epoch) as Omni-CMS expects
  const createdAt = dateToUnixTimestamp(wpPost.date_gmt || wpPost.date);
  const updatedAt = dateToUnixTimestamp(wpPost.modified_gmt || wpPost.modified);
  const publishedAt = wpPost.status === 'publish' 
    ? dateToUnixTimestamp(wpPost.date_gmt || wpPost.date)
    : undefined;
  
  // Store WordPress media ID in metadata for later mapping after media upload
  const wpMediaId = wpPost.featured_media > 0 ? wpPost.featured_media : undefined;
  
  return {
    title: wpPost.title.rendered,
    slug: sanitizeSlug(wpPost.slug),
    content: wpPost.content.rendered || '',
    excerpt: wpPost.excerpt?.rendered || undefined,
    status: mapStatus(wpPost.status),
    createdAt, // Unix timestamp from WordPress date_gmt
    updatedAt, // Unix timestamp from WordPress modified_gmt
    publishedAt, // Unix timestamp from WordPress date_gmt (if published)
    featuredImageId: mapMediaId(wpPost.featured_media, mediaMap),
    authorId: mapAuthorId(wpPost.author, authorMap),
    categoryIds: mapTaxonomyIds(wpPost.categories, taxonomyMap),
    tagIds: mapTaxonomyIds(wpPost.tags, taxonomyMap),
    customTaxonomyIds: mappedCustomTaxonomies, // Custom taxonomy relationships
    customFields: Object.keys(mappedCustomFields).length > 0 ? mappedCustomFields : undefined,
    relationships, // Store relationship data for later import
    metadata: {
      wordpressId: wpPost.id,
      wordpressUrl: wpPost.link,
      wordpressMediaId: wpMediaId, // Store original WordPress media ID for mapping
      importedAt: Math.floor(Date.now() / 1000), // Unix timestamp
    },
  };
}

