/**
 * Generate Repopulation Migration from Transformed Data
 * 
 * Reads transformed JSON files and generates SQL INSERT statements
 * for a Drizzle migration file to repopulate all content.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Organization configuration
const ORGANIZATIONS = [
  {
    slug: 'study-in-north-cyprus',
    name: 'Study in North Cyprus',
    orgId: '3Kyv3hvrybf_YohTZRgPV',
  },
  {
    slug: 'study-in-kazakhstan',
    name: 'Study In Kazakhstan',
    orgId: 'IBfLssGjH23-f9uxjH5Ms',
  },
  {
    slug: 'paris-american-international-university',
    name: 'Paris American International University',
    orgId: 'ND-k8iHHx70s5XaW28Mk2',
  },
];

const SYSTEM_USER_ID = 'system-user-api';

// Helper functions
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeJson(str) {
  if (str === null || str === undefined) return 'NULL';
  return escapeSql(JSON.stringify(str));
}

// Generate a unique ID (we'll use a counter + random for uniqueness)
let idCounter = 0;
function generateId() {
  idCounter++;
  // Use a deterministic approach: org prefix + counter + random
  // For SQL, we'll use the function call
  return `lower(hex(randomblob(12)))`;
}

// For in-memory maps, generate actual IDs
const idCache = new Map();
function getCachedId(key) {
  if (!idCache.has(key)) {
    idCache.set(key, `id_${idCounter++}_${Math.random().toString(36).substr(2, 9)}`);
  }
  return idCache.get(key);
}

function generateTimestamp() {
  return `strftime('%s', 'now')`;
}

/**
 * Load transformed data for an organization
 */
async function loadTransformedData(orgSlug) {
  const transformedDir = path.join(__dirname, `../organizations/${orgSlug}/transformed`);
  const data = {};

  try {
    const dirs = await fs.readdir(transformedDir);
    for (const dir of dirs) {
      const filePath = path.join(transformedDir, dir, 'transformed.json');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        data[dir] = JSON.parse(content);
      } catch (error) {
        console.warn(`  ⚠ Could not load ${dir}: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn(`  ⚠ Could not read transformed directory for ${orgSlug}: ${error.message}`);
  }

  return data;
}

/**
 * Load media mappings for an organization
 */
async function loadMediaMappings(orgSlug) {
  const mappingPath = path.join(__dirname, `../organizations/${orgSlug}/import-mappings/media.json`);
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`  ⚠ Could not load media mappings for ${orgSlug}: ${error.message}`);
    return {};
  }
}

/**
 * Load raw taxonomy data for an organization
 */
async function loadRawTaxonomyData(orgSlug) {
  const taxonomiesPath = path.join(__dirname, `../organizations/${orgSlug}/raw-data/taxonomies.json`);
  const customTaxonomiesPath = path.join(__dirname, `../organizations/${orgSlug}/raw-data/custom-taxonomies.json`);
  
  const data = {
    categories: [],
    tags: [],
    customTaxonomies: {},
  };

  try {
    const taxonomiesContent = await fs.readFile(taxonomiesPath, 'utf-8');
    const taxonomies = JSON.parse(taxonomiesContent);
    if (taxonomies.categories) data.categories = taxonomies.categories;
    if (taxonomies.tags) data.tags = taxonomies.tags;
  } catch (error) {
    console.warn(`  ⚠ Could not load taxonomies for ${orgSlug}: ${error.message}`);
  }

  try {
    const customTaxonomiesContent = await fs.readFile(customTaxonomiesPath, 'utf-8');
    data.customTaxonomies = JSON.parse(customTaxonomiesContent);
  } catch (error) {
    console.warn(`  ⚠ Could not load custom taxonomies for ${orgSlug}: ${error.message}`);
  }

  return data;
}

/**
 * Generate SQL for post types
 */
function generatePostTypesSQL(org, transformedData) {
  const sql = [];
  const postTypeMap = new Map(); // slug -> id

  // Extract unique post types from all content types
  // Keep original slugs (kebab-case) to match database
  const postTypeSlugs = new Set();
  Object.keys(transformedData).forEach(contentType => {
    postTypeSlugs.add(contentType); // Keep original format
  });

  // Generate post types
  for (const slug of postTypeSlugs) {
    const id = generateId();
    const name = slug
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    sql.push(`INSERT OR IGNORE INTO post_types (id, organization_id, name, slug, description, icon, is_hierarchical, settings, created_at, updated_at)`);
    sql.push(`VALUES (${id}, ${escapeSql(org.orgId)}, ${escapeSql(name)}, ${escapeSql(slug)}, NULL, NULL, 0, NULL, ${generateTimestamp()}, ${generateTimestamp()});`);
    sql.push(``);
    
    postTypeMap.set(slug, id);
  }

  return { sql, postTypeMap };
}

/**
 * Generate SQL for taxonomies
 */
function generateTaxonomiesSQL(org, transformedData) {
  const sql = [];
  const taxonomyMap = new Map(); // slug -> id

  // Extract taxonomies from transformed data
  // We need to check what taxonomies are referenced
  const taxonomySlugs = new Set();
  
  // Check all posts for taxonomy references
  Object.values(transformedData).forEach(posts => {
    if (Array.isArray(posts)) {
      posts.forEach(post => {
        if (post.categoryIds && post.categoryIds.length > 0) {
          taxonomySlugs.add('categories');
        }
        if (post.tagIds && post.tagIds.length > 0) {
          taxonomySlugs.add('tags');
        }
        if (post.customTaxonomyIds) {
          Object.keys(post.customTaxonomyIds).forEach(slug => {
            taxonomySlugs.add(slug);
          });
        }
      });
    }
  });

  // Generate taxonomies
  for (const slug of taxonomySlugs) {
    const id = generateId();
    const name = slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    sql.push(`INSERT OR IGNORE INTO taxonomies (id, organization_id, name, slug, is_hierarchical, created_at, updated_at)`);
    sql.push(`VALUES (${id}, ${escapeSql(org.orgId)}, ${escapeSql(name)}, ${escapeSql(slug)}, 0, ${generateTimestamp()}, ${generateTimestamp()});`);
    sql.push(``);
    
    taxonomyMap.set(slug, id);
  }

  return { sql, taxonomyMap };
}

/**
 * Generate SQL for taxonomy terms
 */
function generateTaxonomyTermsSQL(org, transformedData, taxonomyMap, rawTaxonomyData) {
  const sql = [];
  const termMap = new Map(); // wp-taxonomy-slug-id -> omni-id
  const termDataMap = new Map(); // wp-taxonomy-slug-id -> {name, slug, parent}

  // Build term data map from raw taxonomy data
  // Categories
  if (rawTaxonomyData.categories) {
    rawTaxonomyData.categories.forEach(term => {
      const key = `categories-${term.id}`;
      termDataMap.set(key, {
        name: term.name,
        slug: term.slug,
        parent: term.parent || 0,
      });
    });
  }

  // Tags
  if (rawTaxonomyData.tags) {
    rawTaxonomyData.tags.forEach(term => {
      const key = `tags-${term.id}`;
      termDataMap.set(key, {
        name: term.name,
        slug: term.slug,
        parent: 0,
      });
    });
  }

  // Custom taxonomies
  if (rawTaxonomyData.customTaxonomies) {
    Object.entries(rawTaxonomyData.customTaxonomies).forEach(([taxSlug, terms]) => {
      if (Array.isArray(terms)) {
        terms.forEach(term => {
          const key = `${taxSlug}-${term.id}`;
          // Also try wp-taxonomy format
          const wpKey = `wp-taxonomy-${taxSlug}-${term.id}`;
          termDataMap.set(key, {
            name: term.name,
            slug: term.slug,
            parent: term.parent || 0,
          });
          termDataMap.set(wpKey, {
            name: term.name,
            slug: term.slug,
            parent: term.parent || 0,
          });
        });
      }
    });
  }

  // Collect all terms referenced in posts
  const termsByTaxonomy = new Map(); // taxonomy-slug -> Set of term keys

  Object.values(transformedData).forEach(posts => {
    if (Array.isArray(posts)) {
      posts.forEach(post => {
        // Categories
        if (post.categoryIds) {
          post.categoryIds.forEach(catId => {
            const key = `categories-${catId}`;
            if (!termsByTaxonomy.has('categories')) {
              termsByTaxonomy.set('categories', new Set());
            }
            termsByTaxonomy.get('categories').add(key);
          });
        }

        // Tags
        if (post.tagIds) {
          post.tagIds.forEach(tagId => {
            const key = `tags-${tagId}`;
            if (!termsByTaxonomy.has('tags')) {
              termsByTaxonomy.set('tags', new Set());
            }
            termsByTaxonomy.get('tags').add(key);
          });
        }

        // Custom taxonomies
        if (post.customTaxonomyIds) {
          Object.entries(post.customTaxonomyIds).forEach(([taxSlug, termPlaceholders]) => {
            if (!termsByTaxonomy.has(taxSlug)) {
              termsByTaxonomy.set(taxSlug, new Set());
            }
            termPlaceholders.forEach(placeholder => {
              // Extract ID from placeholder (e.g., "wp-taxonomy-disciplines-381" -> "disciplines-381")
              const parts = placeholder.split('-');
              if (parts.length >= 3) {
                const id = parts[parts.length - 1];
                const slug = parts.slice(2, -1).join('-');
                const key = `${slug}-${id}`;
                termsByTaxonomy.get(taxSlug).add(key);
                // Also map the original placeholder
                termMap.set(placeholder, null); // Will be set later
              }
            });
          });
        }
      });
    }
  });

  // Generate terms, handling parent relationships
  // First pass: create parent terms
  const parentTermMap = new Map(); // parent wp-id -> omni-id
  
  for (const [taxSlug, termKeys] of termsByTaxonomy.entries()) {
    const taxonomyId = taxonomyMap.get(taxSlug);
    if (!taxonomyId) continue;

    // Sort: parents first (parent = 0), then children
    const sortedKeys = Array.from(termKeys).sort((a, b) => {
      const aData = termDataMap.get(a);
      const bData = termDataMap.get(b);
      const aParent = aData?.parent || 0;
      const bParent = bData?.parent || 0;
      return aParent - bParent;
    });

    for (const key of sortedKeys) {
      let termData = termDataMap.get(key);
      if (!termData) {
        // Fallback: generate from key
        const parts = key.split('-');
        const id = parts[parts.length - 1];
        termData = {
          name: `Term ${id}`,
          slug: key.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          parent: 0,
        };
      }

      const termIdExpr = generateId();
      
      // Handle parent relationship - use subquery to find parent by slug
      let parentIdExpr = 'NULL';
      if (termData.parent && termData.parent !== 0) {
        const parentKey = `${taxSlug}-${termData.parent}`;
        const parentData = termDataMap.get(parentKey);
        if (parentData && parentData.slug) {
          parentIdExpr = `(SELECT id FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(taxSlug)} LIMIT 1) AND slug = ${escapeSql(parentData.slug)} LIMIT 1)`;
        }
      }

      // Use subquery to find taxonomy_id by slug
      const taxonomyIdSubquery = `(SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(taxSlug)} LIMIT 1)`;
      
      sql.push(`INSERT OR IGNORE INTO taxonomy_terms (id, taxonomy_id, name, slug, description, parent_id, created_at, updated_at)`);
      sql.push(`VALUES (${termIdExpr}, ${taxonomyIdSubquery}, ${escapeSql(termData.name)}, ${escapeSql(termData.slug)}, NULL, ${parentIdExpr}, ${generateTimestamp()}, ${generateTimestamp()});`);
      sql.push(``);
      
      // Store mapping for later use in post taxonomies
      // We'll use slug-based lookup in SQL
      termMap.set(key, {
        taxonomySlug: taxSlug,
        slug: termData.slug,
      });

      // Also map wp-taxonomy format if needed
      const wpKey = `wp-taxonomy-${key}`;
      termMap.set(wpKey, {
        taxonomySlug: taxSlug,
        slug: termData.slug,
      });
    }
  }

  return { sql, termMap };
}

/**
 * Generate SQL for custom fields
 */
function generateCustomFieldsSQL(org, transformedData) {
  const sql = [];
  const customFieldMap = new Map(); // slug -> id

  // Collect all custom field slugs from posts
  const fieldSlugs = new Set();
  Object.values(transformedData).forEach(posts => {
    if (Array.isArray(posts)) {
      posts.forEach(post => {
        if (post.customFields) {
          Object.keys(post.customFields).forEach(slug => {
            fieldSlugs.add(slug);
          });
        }
      });
    }
  });

  // Generate custom fields
  for (const slug of fieldSlugs) {
    const id = generateId();
    const name = slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Determine field type based on slug or value type
    const fieldType = 'text'; // Default, could be enhanced
    
    sql.push(`INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)`);
    sql.push(`VALUES (${id}, ${escapeSql(org.orgId)}, ${escapeSql(name)}, ${escapeSql(slug)}, ${escapeSql(fieldType)}, NULL, ${generateTimestamp()}, ${generateTimestamp()});`);
    sql.push(``);
    
    customFieldMap.set(slug, id);
  }

  return { sql, customFieldMap };
}

/**
 * Generate SQL for posts
 */
function generatePostsSQL(org, transformedData, postTypeMap, termMap, customFieldMap, mediaMap, taxonomyMap) {
  const sql = [];
  const postSlugMap = new Map(); // wpId -> slug (for relationship lookups)
  const postTaxonomiesSQL = [];
  const postFieldValuesSQL = [];

  // Process each content type
  for (const [contentType, posts] of Object.entries(transformedData)) {
    if (!Array.isArray(posts)) continue;

    // Verify post type exists (we'll use subquery in INSERT)
    if (!postTypeMap.has(contentType)) {
      console.warn(`  ⚠ Post type not found for ${contentType}, skipping posts`);
      continue;
    }

    for (const post of posts) {
      const wpId = post.metadata?.wordpressId;
      if (!wpId || !post.slug) continue;

      const postId = generateId();
      postSlugMap.set(wpId, post.slug); // Store slug for relationship lookups

      // Map featured image
      let featuredImageId = 'NULL';
      if (post.featuredImageId) {
        const wpMediaId = post.featuredImageId.replace('wp-media-', '');
        const omniMediaId = mediaMap[wpMediaId];
        if (omniMediaId) {
          featuredImageId = escapeSql(omniMediaId);
        }
      }

      // Use subquery to find post_type_id by slug
      const postTypeIdSubquery = `(SELECT id FROM post_types WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(contentType)} LIMIT 1)`;

      // Generate post INSERT
      sql.push(`INSERT OR IGNORE INTO posts (`);
      sql.push(`  id, organization_id, post_type_id, author_id, title, slug, content, excerpt,`);
      sql.push(`  status, workflow_status, parent_id, featured_image_id, published_at,`);
      sql.push(`  scheduled_publish_at, meta_title, meta_description, meta_keywords,`);
      sql.push(`  og_image_id, canonical_url, structured_data, created_at, updated_at`);
      sql.push(`) VALUES (`);
      sql.push(`  ${postId},`);
      sql.push(`  ${escapeSql(org.orgId)},`);
      sql.push(`  ${postTypeIdSubquery},`);
      sql.push(`  ${escapeSql(SYSTEM_USER_ID)},`);
      sql.push(`  ${escapeSql(post.title || '')},`);
      sql.push(`  ${escapeSql(post.slug || '')},`);
      sql.push(`  ${escapeSql(post.content || '')},`);
      sql.push(`  ${escapeSql(post.excerpt || '')},`);
      sql.push(`  ${escapeSql(post.status || 'draft')},`);
      sql.push(`  NULL,`); // workflow_status
      sql.push(`  NULL,`); // parent_id
      sql.push(`  ${featuredImageId},`);
      sql.push(`  ${post.publishedAt ? post.publishedAt : 'NULL'},`);
      sql.push(`  NULL,`); // scheduled_publish_at
      sql.push(`  NULL,`); // meta_title
      sql.push(`  NULL,`); // meta_description
      sql.push(`  NULL,`); // meta_keywords
      sql.push(`  NULL,`); // og_image_id
      sql.push(`  NULL,`); // canonical_url
      sql.push(`  NULL,`); // structured_data
      sql.push(`  ${post.createdAt || generateTimestamp()},`);
      sql.push(`  ${post.updatedAt || generateTimestamp()}`);
      sql.push(`);`);
      sql.push(``);

      // Generate post_taxonomies INSERTs using subqueries to find posts and terms by slug
      const postIdSubquery = `(SELECT id FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(post.slug)} LIMIT 1)`;
      
      // Categories
      if (post.categoryIds) {
        post.categoryIds.forEach(catId => {
          const termKey = `categories-${catId}`;
          const termInfo = termMap.get(termKey);
          if (termInfo) {
            const termIdSubquery = `(SELECT id FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)} LIMIT 1)`;
            postTaxonomiesSQL.push(`INSERT OR IGNORE INTO post_taxonomies (id, post_id, taxonomy_term_id, created_at)`);
            postTaxonomiesSQL.push(`SELECT ${generateId()}, ${postIdSubquery}, ${termIdSubquery}, ${generateTimestamp()}`);
            postTaxonomiesSQL.push(`WHERE EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(post.slug)})`);
            postTaxonomiesSQL.push(`  AND EXISTS (SELECT 1 FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)});`);
            postTaxonomiesSQL.push(``);
          }
        });
      }

      // Tags
      if (post.tagIds) {
        post.tagIds.forEach(tagId => {
          const termKey = `tags-${tagId}`;
          const termInfo = termMap.get(termKey);
          if (termInfo) {
            const termIdSubquery = `(SELECT id FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)} LIMIT 1)`;
            postTaxonomiesSQL.push(`INSERT OR IGNORE INTO post_taxonomies (id, post_id, taxonomy_term_id, created_at)`);
            postTaxonomiesSQL.push(`SELECT ${generateId()}, ${postIdSubquery}, ${termIdSubquery}, ${generateTimestamp()}`);
            postTaxonomiesSQL.push(`WHERE EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(post.slug)})`);
            postTaxonomiesSQL.push(`  AND EXISTS (SELECT 1 FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)});`);
            postTaxonomiesSQL.push(``);
          }
        });
      }

      // Custom taxonomies
      if (post.customTaxonomyIds) {
        Object.entries(post.customTaxonomyIds).forEach(([taxSlug, termPlaceholders]) => {
          const taxonomyId = taxonomyMap.get(taxSlug);
          if (!taxonomyId) return;

          termPlaceholders.forEach(placeholder => {
            // Extract ID from placeholder
            const parts = placeholder.split('-');
            if (parts.length >= 3) {
              const id = parts[parts.length - 1];
              const slugPart = parts.slice(2, -1).join('-');
              const termKey = `${slugPart}-${id}`;
              const termInfo = termMap.get(termKey);
              
              if (termInfo) {
                const termIdSubquery = `(SELECT id FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)} LIMIT 1)`;
                postTaxonomiesSQL.push(`INSERT OR IGNORE INTO post_taxonomies (id, post_id, taxonomy_term_id, created_at)`);
                postTaxonomiesSQL.push(`SELECT ${generateId()}, ${postIdSubquery}, ${termIdSubquery}, ${generateTimestamp()}`);
                postTaxonomiesSQL.push(`WHERE EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(post.slug)})`);
                postTaxonomiesSQL.push(`  AND EXISTS (SELECT 1 FROM taxonomy_terms WHERE taxonomy_id = (SELECT id FROM taxonomies WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(termInfo.taxonomySlug)} LIMIT 1) AND slug = ${escapeSql(termInfo.slug)});`);
                postTaxonomiesSQL.push(``);
              }
            }
          });
        });
      }

      // Generate post_field_values INSERTs
      if (post.customFields) {
        Object.entries(post.customFields).forEach(([fieldSlug, value]) => {
          const fieldId = customFieldMap.get(fieldSlug);
          if (fieldId) {
            // Handle array values (e.g., photos)
            const fieldValue = Array.isArray(value) ? JSON.stringify(value) : String(value);
            postFieldValuesSQL.push(`INSERT OR IGNORE INTO post_field_values (id, post_id, custom_field_id, value, created_at, updated_at)`);
            postFieldValuesSQL.push(`SELECT ${generateId()}, ${postIdSubquery}, ${fieldId}, ${escapeSql(fieldValue)}, ${generateTimestamp()}, ${generateTimestamp()}`);
            postFieldValuesSQL.push(`WHERE EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(post.slug)});`);
            postFieldValuesSQL.push(``);
          }
        });
      }
    }
  }

  return { sql, postSlugMap, postTaxonomiesSQL, postFieldValuesSQL };
}

/**
 * Generate SQL for post relationships
 */
function generatePostRelationshipsSQL(org, transformedData, postSlugMap) {
  const sql = [];

  // Process programs to find university relationships
  const programs = transformedData['programs'] || [];
  
  for (const program of programs) {
    const wpProgramId = program.metadata?.wordpressId;
    if (!wpProgramId || !program.slug) continue;

    // Check for university relationship
    if (program.relationships?.university) {
      const universityName = program.relationships.university.wordpressName;
      // Find university by name in universities
      const universities = transformedData['universities'] || [];
      const university = universities.find(u => 
        u.title === universityName || 
        u.customFields?.university_name === universityName
      );

      if (university && university.slug) {
        // Use subqueries to find posts by slug
        const programIdSubquery = `(SELECT id FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(program.slug)} LIMIT 1)`;
        const universityIdSubquery = `(SELECT id FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(university.slug)} LIMIT 1)`;
        
        sql.push(`INSERT OR IGNORE INTO post_relationships (id, from_post_id, to_post_id, relationship_type, created_at)`);
        sql.push(`SELECT ${generateId()}, ${programIdSubquery}, ${universityIdSubquery}, ${escapeSql('university')}, ${generateTimestamp()}`);
        sql.push(`WHERE EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(program.slug)})`);
        sql.push(`  AND EXISTS (SELECT 1 FROM posts WHERE organization_id = ${escapeSql(org.orgId)} AND slug = ${escapeSql(university.slug)});`);
        sql.push(``);
      }
    }
  }

  return sql;
}

/**
 * Main function
 */
async function main() {
  console.log('Generating repopulation migration from transformed data...\n');

  const migrationFile = path.join(__dirname, '../../apps/api/drizzle/migrations/0004_repopulate_content.sql');
  
  // Build file content incrementally
  let fileContent = '';
  fileContent += '-- Migration: Repopulate Content from Transformed Data\n';
  fileContent += '-- Generated from transformed JSON files\n';
  fileContent += '-- This migration repopulates all content data after cleanup\n';
  fileContent += '\n';
  fileContent += '-- Note: This uses INSERT OR IGNORE for idempotency\n';
  fileContent += '-- Note: IDs are generated using lower(hex(randomblob(12)))\n';
  fileContent += '-- Note: Timestamps use strftime(\'%s\', \'now\')\n';
  fileContent += '\n';

  // Process each organization
  for (const org of ORGANIZATIONS) {
    console.log(`Processing ${org.name}...`);
    
    // Load data
    const transformedData = await loadTransformedData(org.slug);
    const mediaMap = await loadMediaMappings(org.slug);
    const rawTaxonomyData = await loadRawTaxonomyData(org.slug);

    if (Object.keys(transformedData).length === 0) {
      console.log(`  ⚠ No transformed data found, skipping`);
      continue;
    }

    // Generate SQL for each data type
    fileContent += `-- ============================================================\n`;
    fileContent += `-- ${org.name} (${org.slug})\n`;
    fileContent += `-- ============================================================\n`;
    fileContent += '\n';

    // Helper function to append SQL array
    const appendSQL = (sqlArray) => {
      for (const line of sqlArray) {
        fileContent += line + '\n';
      }
    };

    // 1. Post Types
    console.log(`  Generating post types...`);
    const { sql: postTypesSQL, postTypeMap } = generatePostTypesSQL(org, transformedData);
    appendSQL(postTypesSQL);

    // 2. Taxonomies
    console.log(`  Generating taxonomies...`);
    const { sql: taxonomiesSQL, taxonomyMap } = generateTaxonomiesSQL(org, transformedData);
    appendSQL(taxonomiesSQL);

    // 3. Taxonomy Terms
    console.log(`  Generating taxonomy terms...`);
    const { sql: termsSQL, termMap } = generateTaxonomyTermsSQL(org, transformedData, taxonomyMap, rawTaxonomyData);
    appendSQL(termsSQL);

    // 4. Custom Fields
    console.log(`  Generating custom fields...`);
    const { sql: customFieldsSQL, customFieldMap } = generateCustomFieldsSQL(org, transformedData);
    appendSQL(customFieldsSQL);

    // 5. Posts
    console.log(`  Generating posts...`);
    const { sql: postsSQL, postSlugMap, postTaxonomiesSQL, postFieldValuesSQL } = generatePostsSQL(
      org, transformedData, postTypeMap, termMap, customFieldMap, mediaMap, taxonomyMap
    );
    appendSQL(postsSQL);

    // 6. Post Taxonomies
    console.log(`  Generating post taxonomies...`);
    appendSQL(postTaxonomiesSQL);

    // 7. Post Field Values
    console.log(`  Generating post field values...`);
    appendSQL(postFieldValuesSQL);

    // 8. Post Relationships
    console.log(`  Generating post relationships...`);
    const relationshipsSQL = generatePostRelationshipsSQL(org, transformedData, postSlugMap);
    appendSQL(relationshipsSQL);

    console.log(`  ✓ Completed ${org.name}\n`);
  }

  // Write migration file
  await fs.writeFile(migrationFile, fileContent, 'utf-8');

  console.log(`✅ Migration file generated: ${migrationFile}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated SQL file`);
  console.log(`2. Run cleanup migration: npx wrangler d1 execute omni-cms --remote --file=apps/api/drizzle/migrations/0003_cleanup_content.sql`);
  console.log(`3. Run repopulation migration: npx wrangler d1 execute omni-cms --remote --file=apps/api/drizzle/migrations/0004_repopulate_content.sql`);
}

main().catch(console.error);

