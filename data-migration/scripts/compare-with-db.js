/**
 * Compare Local Data with Database
 * 
 * Fetches all existing data from the database in bulk, caches it locally,
 * and compares with transformed data files to identify gaps.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrganizationId, apiRequest, getExistingPosts } from '../shared/utils/api-client.js';
import { filterExistingData } from './filter-existing-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get all posts with their relationships
 */
async function getPostWithRelationships(baseUrl, orgId, postId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts/${postId}`;
  try {
    const data = await apiRequest(url, { apiKey });
    if (data.success && data.data) {
      return data.data;
    }
  } catch (error) {
    // Post might not exist or have relationships
    return null;
  }
  return null;
}

/**
 * Get all media items
 */
async function getAllMedia(baseUrl, orgId, apiKey) {
  const url = `${baseUrl}/api/admin/v1/organizations/${orgId}/media`;
  try {
    const data = await apiRequest(url, { apiKey });
    if (data.success && data.data) {
      return Array.isArray(data.data) ? data.data : [data.data];
    }
  } catch (error) {
    console.warn(`   ⚠ Could not fetch media: ${error.message}`);
  }
  return [];
}

/**
 * Fetch and cache all database data
 */
async function fetchAndCacheDbData(baseUrl, orgId, orgSlug, apiKey) {
  const cacheDir = path.join(__dirname, `../organizations/${orgSlug}/db-cache`);
  await fs.mkdir(cacheDir, { recursive: true });

  console.log(`\n📥 Fetching data from database...`);

  // Use filterExistingData to get comprehensive data
  const existingData = await filterExistingData(baseUrl, orgId, apiKey);

  // Get all post types
  const postTypesUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/post-types`;
  const postTypesData = await apiRequest(postTypesUrl, { apiKey });
  const postTypes = postTypesData.success && postTypesData.data 
    ? (Array.isArray(postTypesData.data) ? postTypesData.data : [postTypesData.data])
    : [];

  // Fetch all posts grouped by post type
  const postsByType = {};
  console.log(`   Fetching posts for ${postTypes.length} post types...`);
  
  for (const postType of postTypes) {
    console.log(`     Fetching ${postType.slug}...`);
    const posts = await getExistingPosts(baseUrl, orgId, postType.id, apiKey);
    postsByType[postType.slug] = posts.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      postTypeId: p.postTypeId,
      featuredImageId: p.featuredImageId,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  // Fetch all taxonomies with terms
  const taxonomiesUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies`;
  const taxonomiesData = await apiRequest(taxonomiesUrl, { apiKey });
  const taxonomies = taxonomiesData.success && taxonomiesData.data
    ? (Array.isArray(taxonomiesData.data) ? taxonomiesData.data : [taxonomiesData.data])
    : [];

  const taxonomiesWithTerms = [];
  for (const taxonomy of taxonomies) {
    const taxonomyUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/taxonomies/${taxonomy.id}`;
    const taxonomyDetail = await apiRequest(taxonomyUrl, { apiKey });
    
    taxonomiesWithTerms.push({
      id: taxonomy.id,
      name: taxonomy.name,
      slug: taxonomy.slug,
      isHierarchical: taxonomy.isHierarchical,
      terms: taxonomyDetail.success && taxonomyDetail.data?.terms
        ? (Array.isArray(taxonomyDetail.data.terms) ? taxonomyDetail.data.terms : [taxonomyDetail.data.terms])
        : [],
    });
  }

  // Fetch all custom fields
  const customFieldsUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/custom-fields`;
  const customFieldsData = await apiRequest(customFieldsUrl, { apiKey });
  const customFields = customFieldsData.success && customFieldsData.data
    ? (Array.isArray(customFieldsData.data) ? customFieldsData.data : [customFieldsData.data])
    : [];

  // Fetch all media
  console.log(`   Fetching media...`);
  const media = await getAllMedia(baseUrl, orgId, apiKey);

  // Fetch relationships by getting full post details (includes relationships)
  console.log(`   Fetching post relationships...`);
  const relationships = [];
  let relationshipCount = 0;
  
  // Get all programs to check for relationships (programs -> universities)
  const programs = postsByType['programs'] || [];
  console.log(`     Checking ${programs.length} programs for relationships...`);
  
  for (const post of programs) {
    const fullPost = await getPostWithRelationships(baseUrl, orgId, post.id, apiKey);
    if (fullPost && fullPost.relationships && fullPost.relationships.length > 0) {
      relationships.push({
        sourcePostId: post.id,
        sourcePostSlug: post.slug,
        sourcePostType: 'programs',
        relationships: fullPost.relationships.map(rel => ({
          targetPostId: rel.targetPostId || rel.toPostId,
          relationshipType: rel.relationshipType || rel.relationship_type,
        })),
      });
      relationshipCount += fullPost.relationships.length;
    }
  }

  console.log(`   ✓ Found ${relationshipCount} relationships`);

  // Cache all data
  await fs.writeFile(
    path.join(cacheDir, 'posts.json'),
    JSON.stringify(postsByType, null, 2)
  );

  await fs.writeFile(
    path.join(cacheDir, 'taxonomies.json'),
    JSON.stringify(taxonomiesWithTerms, null, 2)
  );

  await fs.writeFile(
    path.join(cacheDir, 'custom-fields.json'),
    JSON.stringify(customFields, null, 2)
  );

  await fs.writeFile(
    path.join(cacheDir, 'relationships.json'),
    JSON.stringify(relationships, null, 2)
  );

  await fs.writeFile(
    path.join(cacheDir, 'media.json'),
    JSON.stringify(media, null, 2)
  );

  console.log(`   ✓ Cached all data to ${cacheDir}\n`);

  return {
    postsByType,
    taxonomiesWithTerms,
    customFields,
    relationships,
    media,
  };
}

/**
 * Compare cached DB data with transformed data
 */
async function compareData(orgSlug, dbData) {
  console.log(`\n🔍 Comparing with transformed data...`);

  const transformedDir = path.join(__dirname, `../organizations/${orgSlug}/transformed`);
  const contentTypeDirs = ['blogs', 'programs', 'universities', 'team-members', 'reviews', 'video-testimonials', 'dormitories'];

  const comparison = {
    posts: {
      missing_in_db: [],
      missing_in_transformed: [],
      total_db: 0,
      total_transformed: 0,
    },
    relationships: {
      missing_program_university: [],
      total_db: dbData.relationships.length,
      total_expected: 0,
    },
    taxonomy_terms: {
      missing_assignments: [],
    },
  };

  // Compare posts
  for (const contentType of contentTypeDirs) {
    const transformedPath = path.join(transformedDir, `${contentType}/transformed.json`);
    
    try {
      await fs.access(transformedPath);
      const transformedContent = await fs.readFile(transformedPath, 'utf-8');
      const transformedPosts = JSON.parse(transformedContent);

      const dbPosts = dbData.postsByType[contentType] || [];
      const dbSlugs = new Set(dbPosts.map(p => p.slug));
      const transformedSlugs = new Set(transformedPosts.map(p => p.slug));

      // Find missing in DB
      transformedPosts.forEach(post => {
        if (!dbSlugs.has(post.slug)) {
          comparison.posts.missing_in_db.push({
            contentType,
            title: post.title,
            slug: post.slug,
            wordpressId: post.metadata?.wordpressId,
          });
        }
      });

      // Find missing in transformed (optional - for reference)
      dbPosts.forEach(post => {
        if (!transformedSlugs.has(post.slug)) {
          comparison.posts.missing_in_transformed.push({
            contentType,
            title: post.title,
            slug: post.slug,
            id: post.id,
          });
        }
      });

      comparison.posts.total_db += dbPosts.length;
      comparison.posts.total_transformed += transformedPosts.length;

      console.log(`   ${contentType}: DB=${dbPosts.length}, Transformed=${transformedPosts.length}, Missing=${transformedPosts.filter(p => !dbSlugs.has(p.slug)).length}`);
    } catch (error) {
      // File doesn't exist - skip
    }
  }

  // Check program-university relationships
  const programsPath = path.join(transformedDir, 'programs/transformed.json');
  try {
    await fs.access(programsPath);
    const programsContent = await fs.readFile(programsPath, 'utf-8');
    const programs = JSON.parse(programsContent);

    const dbPrograms = dbData.postsByType['programs'] || [];
    const dbProgramSlugs = new Set(dbPrograms.map(p => p.slug));
    const dbUniversities = dbData.postsByType['universities'] || [];
    const dbUniversitySlugs = new Set(dbUniversities.map(p => p.slug));

    // Build relationship map from DB
    const dbRelationships = new Map(); // Maps programId -> Set of universityIds
    dbData.relationships.forEach(rel => {
      if (rel.sourcePostType === 'programs') {
        if (!dbRelationships.has(rel.sourcePostId)) {
          dbRelationships.set(rel.sourcePostId, new Set());
        }
        rel.relationships.forEach(r => {
          if (r.relationshipType === 'university') {
            dbRelationships.get(rel.sourcePostId).add(r.targetPostId);
          }
        });
      }
    });

    // Check which programs should have university relationships
    programs.forEach(program => {
      if (!dbProgramSlugs.has(program.slug)) {
        return; // Program not in DB yet
      }

      const dbProgram = dbPrograms.find(p => p.slug === program.slug);
      if (!dbProgram) return;

      // Check if program has university relationship in transformed data
      const universityName = program.customFields?.associated_university_name || program.customFields?.university_name;
      if (universityName) {
        const dbUniversity = dbUniversities.find(u => 
          u.title.toLowerCase().trim() === universityName.toLowerCase().trim()
        );

        if (dbUniversity) {
          const programRelationships = dbRelationships.get(dbProgram.id) || new Set();
          if (!programRelationships.has(dbUniversity.id)) {
            comparison.relationships.missing_program_university.push({
              programId: dbProgram.id,
              programSlug: dbProgram.slug,
              programTitle: dbProgram.title,
              universityId: dbUniversity.id,
              universitySlug: dbUniversity.slug,
              universityTitle: dbUniversity.title,
            });
          }
        }
      }
    });

    comparison.relationships.total_expected = programs.length;
  } catch (error) {
    console.warn(`   ⚠ Could not check program relationships: ${error.message}`);
  }

  return comparison;
}

/**
 * Main comparison function
 */
export async function compareWithDb(baseUrl, orgSlug, apiKey) {
  console.log(`\n============================================================`);
  console.log(`Comparing: ${orgSlug}`);
  console.log(`============================================================`);

  // Get organization ID
  const orgId = await getOrganizationId(baseUrl, orgSlug, apiKey);

  // Fetch and cache DB data
  const dbData = await fetchAndCacheDbData(baseUrl, orgId, orgSlug, apiKey);

  // Compare with transformed data
  const comparison = await compareData(orgSlug, dbData);

  // Save comparison report
  const reportPath = path.join(__dirname, `../organizations/${orgSlug}/comparison-report.json`);
  await fs.writeFile(reportPath, JSON.stringify(comparison, null, 2));

  console.log(`\n📊 Comparison Summary:`);
  console.log(`   Posts - DB: ${comparison.posts.total_db}, Transformed: ${comparison.posts.total_transformed}`);
  console.log(`   Missing in DB: ${comparison.posts.missing_in_db.length}`);
  console.log(`   Relationships - DB: ${comparison.relationships.total_db}, Expected: ${comparison.relationships.total_expected}`);
  console.log(`   Missing relationships: ${comparison.relationships.missing_program_university.length}`);
  console.log(`\n   ✓ Report saved to: ${reportPath}\n`);

  return { dbData, comparison };
}

/**
 * CLI execution
 */
async function main() {
  const baseUrl = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
  const orgSlug = process.argv[2] || 'study-in-north-cyprus';
  const apiKey = process.env.OMNI_CMS_API_KEY;

  if (!apiKey) {
    console.error('Error: OMNI_CMS_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    await compareWithDb(baseUrl, orgSlug, apiKey);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

