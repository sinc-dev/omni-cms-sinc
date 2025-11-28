/**
 * Assign real users as authors to posts using WordPress author data
 * 
 * This script:
 * 1. Maps WordPress author slugs to user emails
 * 2. Reads WordPress posts data (if available) to get author assignments
 * 3. Uses posts.json mapping to connect WordPress post IDs to new post IDs
 * 4. Generates SQL to update posts.author_id
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');

// User emails to match (will be loaded from database)
const USER_EMAILS = [
  'abdulraheem@studyinnc.com',
  'joseph@studyinnc.com',
  'safak@studyinnc.com',
  'grace@studyinnc.com',
  'jesse@studyinnc.com',
  'selman@studyinnc.com',
  'zahra@studyinnc.com',
  'christiane@studyinnc.com'
];

// Map WordPress author slugs to user emails
// Based on the pattern: slug@studyinnc.com
// Note: Some users (joseph, grace, etc.) are the same person across organizations
const AUTHOR_SLUG_TO_EMAIL = {
  'abdulraheem': 'abdulraheem@studyinnc.com',
  'joseph': 'joseph@studyinnc.com', // Same person across all orgs
  'safak': 'safak@studyinnc.com',
  'grace': 'grace@studyinnc.com', // Same person across all orgs
  'jesse': 'jesse@studyinnc.com',
  'selman': 'selman@studyinnc.com',
  'zahra': 'zahra@studyinnc.com',
  'christiane': 'christiane@studyinnc.com',
  // Newly created users
  'caleb': 'caleb@studyinnc.com',
  'laiba': 'laiba@studyinnc.com',
  'sinc': 'sinc@studyinnc.com',
  'study-in-kazakhstan': 'info@studyinkzk.com'
};

// Will be populated from database query
let EMAIL_TO_USER_ID = new Map();
let ALL_USER_IDS = [];

/**
 * Parse CSV line (handles quoted values with commas)
 */
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  return parts;
}

/**
 * Load users from database query result or CSV
 * For now, we'll use a simple approach: query the database or use provided user data
 */
async function loadUsers() {
  // Try to read from a users CSV if it exists
  const usersCsvPath = path.join(CSV_DIR, 'users.csv');
  try {
    const content = await fs.readFile(usersCsvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const header = lines[0]?.split(',');
    const emailIndex = header?.indexOf('email');
    const idIndex = header?.indexOf('id');
    
    if (emailIndex >= 0 && idIndex >= 0) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const email = parts[emailIndex]?.trim();
        const userId = parts[idIndex]?.trim();
        if (email && userId && USER_EMAILS.includes(email)) {
          EMAIL_TO_USER_ID.set(email, userId);
        }
      }
      console.log(`   ✓ Loaded ${EMAIL_TO_USER_ID.size} users from CSV`);
      return;
    }
  } catch (error) {
    // CSV doesn't exist, continue
  }
  
  // Try to load from new-wordpress-users-to-create.csv (newly created users)
  const newUsersCsvPath = path.join(__dirname, 'new-wordpress-users-to-create.csv');
  try {
    const content = await fs.readFile(newUsersCsvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const header = lines[0]?.split(',');
    const emailIndex = header?.indexOf('email');
    const idIndex = header?.indexOf('id');
    
    if (emailIndex >= 0 && idIndex >= 0) {
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i]);
        const email = parts[emailIndex]?.trim();
        const userId = parts[idIndex]?.trim();
        if (email && userId) {
          EMAIL_TO_USER_ID.set(email.toLowerCase(), userId);
          // Also add to USER_EMAILS if not already there
          if (!USER_EMAILS.includes(email)) {
            USER_EMAILS.push(email);
          }
        }
      }
      console.log(`   ✓ Loaded ${EMAIL_TO_USER_ID.size} users (including newly created)`);
    }
  } catch (error) {
    // CSV doesn't exist, continue
  }
  
  // Fallback: use the user data provided by user
  // You provided these IDs earlier, so we'll use them
  const fallbackUsers = {
    'abdulraheem@studyinnc.com': 'b916ba076ae2f8c8d5d2c2c4ba432d4a',
    'joseph@studyinnc.com': '8074c0461a9cbf572d4a92795adfe2f4',
    'safak@studyinnc.com': '8fc226d2638ad77fd34071c0651a8dc8',
    'grace@studyinnc.com': '7e8307e31a9be8356067959e1a5f0837',
    'jesse@studyinnc.com': '29a6b01446ec648599f7664e28ffa6b6',
    'selman@studyinnc.com': 'c9e2c4cb49e709933c4e63dfaf0b4912',
    'zahra@studyinnc.com': '67ea4f3f459131c602eabd4b69a06b75',
    'christiane@studyinnc.com': '42403f0cb94f6bacac904a8aa564527e'
  };
  
  for (const [email, userId] of Object.entries(fallbackUsers)) {
    if (!EMAIL_TO_USER_ID.has(email)) {
      EMAIL_TO_USER_ID.set(email, userId);
    }
  }
  
  ALL_USER_IDS = Array.from(EMAIL_TO_USER_ID.values());
  console.log(`   ✓ Using ${EMAIL_TO_USER_ID.size} users total`);
}

/**
 * Load WordPress authors mapping
 */
async function loadWordPressAuthors(orgDir) {
  const authorsPath = path.join(orgDir, 'raw-data', 'authors.json');
  try {
    const content = await fs.readFile(authorsPath, 'utf-8');
    const authors = JSON.parse(content);
    
    // Create mapping: WordPress author ID -> user email -> user ID
    const wpAuthorToUserId = new Map();
    
    for (const author of authors) {
      const slug = author.slug?.toLowerCase();
      if (slug && AUTHOR_SLUG_TO_EMAIL[slug]) {
        const email = AUTHOR_SLUG_TO_EMAIL[slug];
        const userId = EMAIL_TO_USER_ID.get(email);
        if (userId) {
          wpAuthorToUserId.set(author.id, userId);
        }
      }
    }
    
    return wpAuthorToUserId;
  } catch (error) {
    console.log(`   ⚠ Could not load authors from ${authorsPath}: ${error.message}`);
    return new Map();
  }
}

/**
 * Load WordPress posts mapping (WordPress post ID -> new post ID)
 */
async function loadPostsMapping(orgDir) {
  const postsMappingPath = path.join(orgDir, 'import-mappings', 'posts.json');
  try {
    const content = await fs.readFile(postsMappingPath, 'utf-8');
    return JSON.parse(content); // { "wp_post_id": "new_post_id", ... }
  } catch (error) {
    console.log(`   ⚠ Could not load posts mapping from ${postsMappingPath}: ${error.message}`);
    return {};
  }
}

/**
 * Load WordPress posts with author data from raw.json files
 */
async function loadWordPressPostAuthors(orgDir) {
  const wpPostAuthors = new Map(); // wpPostId -> wpAuthorId
  
  // Find all raw.json files in subdirectories
  const rawDataDir = path.join(orgDir, 'raw-data');
  try {
    const entries = await fs.readdir(rawDataDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const rawJsonPath = path.join(rawDataDir, entry.name, 'raw.json');
        try {
          const content = await fs.readFile(rawJsonPath, 'utf-8');
          const posts = JSON.parse(content);
          
          for (const post of posts) {
            if (post.id && post.author) {
              // Store both as string and number for flexible lookup
              const wpPostId = String(post.id);
              const wpAuthorId = typeof post.author === 'object' ? post.author.id : post.author;
              wpPostAuthors.set(wpPostId, wpAuthorId);
              // Also store numeric version if different
              if (wpPostId !== String(Number(wpPostId))) {
                wpPostAuthors.set(String(Number(wpPostId)), wpAuthorId);
              }
            }
          }
        } catch (error) {
          // File doesn't exist or invalid JSON, skip
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist, skip
  }
  
  return wpPostAuthors;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Assign Authors to Posts (with WordPress mapping)');
    console.log('============================================================\n');
    
    // Load users first
    await loadUsers();
    
    // Load organization data
    const orgsDir = path.join(__dirname, '..', 'organizations');
    const organizations = ['study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university'];
    
    const wpAuthorMappings = new Map(); // org -> wpAuthorId -> userId
    const postsMappings = {}; // wpPostId -> newPostId
    const wpPostAuthors = new Map(); // wpPostId -> wpAuthorId
    
    for (const orgSlug of organizations) {
      const orgDir = path.join(orgsDir, orgSlug);
      try {
        const wpAuthors = await loadWordPressAuthors(orgDir);
        const postsMap = await loadPostsMapping(orgDir);
        const postAuthors = await loadWordPressPostAuthors(orgDir);
        
        wpAuthorMappings.set(orgSlug, wpAuthors);
        Object.assign(postsMappings, postsMap);
        
        // Merge post authors (wpPostId -> wpAuthorId)
        for (const [wpPostId, wpAuthorId] of postAuthors.entries()) {
          wpPostAuthors.set(wpPostId, wpAuthorId);
        }
        
        console.log(`   ✓ ${orgSlug}: ${wpAuthors.size} author mappings, ${Object.keys(postsMap).length} post mappings, ${postAuthors.size} posts with authors`);
      } catch (error) {
        console.log(`   ⚠ ${orgSlug}: ${error.message}`);
      }
    }
    
    console.log(`   ✓ Total WordPress posts with author data: ${wpPostAuthors.size}`);
    
    console.log(`\nReading posts CSV: ${POSTS_CSV}`);
    const content = await fs.readFile(POSTS_CSV, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    // Find posts with system-user-api
    const postsToUpdate = [];
    const postIdToOrg = new Map(); // newPostId -> orgId
    const postIdToPostType = new Map(); // newPostId -> postTypeId
    const postIdToSlug = new Map(); // newPostId -> slug
    const slugToPostId = new Map(); // slug -> newPostId
    
    for (const line of dataLines) {
      const parts = parseCSVLine(line);
      if (parts.length >= 6) {
        const postId = parts[0]?.trim();
        const orgId = parts[1]?.trim();
        const postTypeId = parts[2]?.trim();
        const authorId = parts[3]?.trim();
        const slug = parts[5]?.trim();
        
        if (postId && authorId === 'system-user-api') {
          postsToUpdate.push(postId);
          postIdToOrg.set(postId, orgId);
          postIdToPostType.set(postId, postTypeId);
          if (slug) {
            postIdToSlug.set(postId, slug);
            slugToPostId.set(slug, postId);
          }
        }
      }
    }
    
    console.log(`   ✓ Found ${postsToUpdate.length} posts with system-user-api`);
    
    // Debug: Check sample post IDs
    console.log(`\n   Debug: Sample post IDs from CSV (first 5):`);
    for (let i = 0; i < Math.min(5, postsToUpdate.length); i++) {
      console.log(`     ${postsToUpdate[i]}`);
    }
    console.log(`   Debug: Sample post IDs from posts.json mapping (first 5):`);
    const sampleMappedIds = Object.values(postsMappings).slice(0, 5);
    for (const id of sampleMappedIds) {
      console.log(`     ${id}`);
    }
    console.log(`   Debug: Total posts in mapping: ${Object.keys(postsMappings).length}`);
    
    // Get Joseph's user ID for fallback
    const josephEmail = 'joseph@studyinnc.com';
    const josephUserId = EMAIL_TO_USER_ID.get(josephEmail);
    if (!josephUserId) {
      throw new Error(`Joseph user (${josephEmail}) not found in database`);
    }
    
    // Get Abdulraheem's user ID for study-in-kazakhstan programs
    const abdulraheemEmail = 'abdulraheem@studyinnc.com';
    const abdulraheemUserId = EMAIL_TO_USER_ID.get(abdulraheemEmail);
    if (!abdulraheemUserId) {
      throw new Error(`Abdulraheem user (${abdulraheemEmail}) not found in database`);
    }
    
    // Load post types CSV to find study-in-kazakhstan programs post type ID
    const postTypesCsvPath = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');
    let studyInKazakhstanOrgId = null;
    let programsPostTypeId = null;
    try {
      const postTypesContent = await fs.readFile(postTypesCsvPath, 'utf-8');
      const postTypesLines = postTypesContent.split('\n').filter(line => line.trim());
      const postTypesHeader = postTypesLines[0]?.split(',');
      const orgIdIndex = postTypesHeader?.indexOf('organization_id');
      const postTypeIdIndex = postTypesHeader?.indexOf('id');
      const slugIndex = postTypesHeader?.indexOf('slug');
      
      for (let i = 1; i < postTypesLines.length; i++) {
        const parts = postTypesLines[i].split(',');
        const orgId = parts[orgIdIndex]?.trim();
        const ptId = parts[postTypeIdIndex]?.trim();
        const slug = parts[slugIndex]?.trim();
        
        // Find study-in-kazakhstan organization (we'll identify it by checking posts)
        // For now, we'll use the post type ID for programs: 37b34cdb6e7f8b1c5fd976c5
        if (slug === 'programs') {
          // Check if this org has study-in-kazakhstan posts by checking a sample
          programsPostTypeId = ptId;
          if (!studyInKazakhstanOrgId) {
            studyInKazakhstanOrgId = orgId;
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠ Could not load post types CSV: ${error.message}`);
    }
    
    // Actually, let's identify study-in-kazakhstan org by checking which org has the programs post type
    // From the CSV we saw: IBfLssGjH23-f9uxjH5Ms has programs type 37b34cdb6e7f8b1c5fd976c5
    // Let's use that directly
    studyInKazakhstanOrgId = 'IBfLssGjH23-f9uxjH5Ms'; // study-in-kazakhstan organization
    programsPostTypeId = '37b34cdb6e7f8b1c5fd976c5'; // programs post type
    
    console.log(`   ✓ Study-in-Kazakhstan Programs: org=${studyInKazakhstanOrgId}, post_type=${programsPostTypeId}`);
    
    // Map using WordPress data
    const assignments = [];
    const unmapped = [];
    const mappedCount = new Map(); // userId -> count
    
    // Debug: Check a few sample mappings
    let sampleChecks = 0;
    const debugSamples = [];
    let foundWpPostId = 0;
    let foundWpAuthor = 0;
    let foundUserMapping = 0;
    
    // Build slug-to-WP-post mapping from raw.json files
    const slugToWpPost = new Map(); // slug -> { wpPostId, wpAuthorId }
    for (const orgSlug of organizations) {
      const orgDir = path.join(orgsDir, orgSlug);
      const rawDataDir = path.join(orgDir, 'raw-data');
      try {
        const entries = await fs.readdir(rawDataDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const rawJsonPath = path.join(rawDataDir, entry.name, 'raw.json');
            try {
              const content = await fs.readFile(rawJsonPath, 'utf-8');
              const posts = JSON.parse(content);
              for (const post of posts) {
                if (post.slug && post.author) {
                  const wpPostId = String(post.id);
                  const wpAuthorId = typeof post.author === 'object' ? post.author.id : post.author;
                  slugToWpPost.set(post.slug, { wpPostId, wpAuthorId });
                }
              }
            } catch (error) {
              // File doesn't exist or invalid JSON, skip
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
    console.log(`   ✓ Built slug-to-WP mapping: ${slugToWpPost.size} posts`);
    
    // Try to map each post using WordPress author data
    for (const newPostId of postsToUpdate) {
      // Special rule: All study-in-kazakhstan programs posts go to Abdulraheem (check FIRST)
      const orgId = postIdToOrg.get(newPostId);
      const postTypeId = postIdToPostType.get(newPostId);
      if (orgId === studyInKazakhstanOrgId && postTypeId === programsPostTypeId) {
        assignments.push({
          postId: newPostId,
          authorId: abdulraheemUserId,
          method: 'study_kazakhstan_programs'
        });
        const count = mappedCount.get(abdulraheemUserId) || 0;
        mappedCount.set(abdulraheemUserId, count + 1);
        continue; // Skip WordPress mapping for these posts
      }
      
      const slug = postIdToSlug.get(newPostId);
      let wpPostId = null;
      let wpAuthorId = null;
      
      // Try matching by slug first (more reliable)
      if (slug && slugToWpPost.has(slug)) {
        const wpData = slugToWpPost.get(slug);
        wpPostId = wpData.wpPostId;
        wpAuthorId = wpData.wpAuthorId;
        foundWpPostId++;
      } else {
        // Fallback: try matching by post ID mapping
        for (const [wpId, newId] of Object.entries(postsMappings)) {
          if (newId === newPostId) {
            wpPostId = String(wpId);
            foundWpPostId++;
            break;
          }
        }
        if (wpPostId && wpPostAuthors.has(wpPostId)) {
          wpAuthorId = wpPostAuthors.get(wpPostId);
        }
      }
      
      if (wpPostId && wpAuthorId) {
        foundWpAuthor++;
        
        // Find which organization this post belongs to (to get the right author mapping)
        let userId = null;
        
        // Try each organization's author mapping
        for (const [orgSlug, authorMap] of wpAuthorMappings.entries()) {
          // Try both numeric and string versions of author ID
          const authorIdNum = Number(wpAuthorId);
          if (authorMap.has(wpAuthorId) || (authorIdNum && authorMap.has(authorIdNum))) {
            userId = authorMap.get(wpAuthorId) || authorMap.get(authorIdNum);
            foundUserMapping++;
            break;
          }
        }
        
        if (userId) {
          assignments.push({
            postId: newPostId,
            authorId: userId,
            method: 'wordpress'
          });
          const count = mappedCount.get(userId) || 0;
          mappedCount.set(userId, count + 1);
          continue;
        } else if (sampleChecks < 10) {
          // Debug: log why mapping failed
          const availableAuthorIds = Array.from(wpAuthorMappings.values())
            .flatMap(map => Array.from(map.keys()))
            .filter(id => id === wpAuthorId || id === Number(wpAuthorId));
          debugSamples.push({
            newPostId: newPostId.substring(0, 12),
            wpPostId,
            wpAuthorId,
            wpAuthorIdType: typeof wpAuthorId,
            hasAuthorMapping: Array.from(wpAuthorMappings.values()).some(map => map.has(wpAuthorId) || map.has(Number(wpAuthorId))),
            availableAuthorIds: Array.from(wpAuthorMappings.values())[0] ? Array.from(wpAuthorMappings.values())[0].keys() : []
          });
          sampleChecks++;
        }
      } else if (sampleChecks < 5 && wpPostId) {
        // Found WP post ID but no author data
        debugSamples.push({
          newPostId: newPostId.substring(0, 12),
          wpPostId,
          issue: 'No author data in wpPostAuthors'
        });
        sampleChecks++;
      }
      
      // Fallback: assign to Joseph
      unmapped.push(newPostId);
    }
    
    console.log(`\n   Debug: Mapping statistics:`);
    console.log(`     Found WP post ID in mapping: ${foundWpPostId}`);
    console.log(`     Found author in WP posts: ${foundWpAuthor}`);
    console.log(`     Found user mapping: ${foundUserMapping}`);
    
    if (debugSamples.length > 0) {
      console.log(`\n   Debug: Sample mapping attempts (first ${Math.min(10, debugSamples.length)}):`);
      for (const sample of debugSamples.slice(0, 10)) {
        if (sample.issue) {
          console.log(`     Post ${sample.newPostId}... -> WP ${sample.wpPostId} -> ${sample.issue}`);
        } else {
          console.log(`     Post ${sample.newPostId}... -> WP ${sample.wpPostId} -> Author ${sample.wpAuthorId} (type: ${sample.wpAuthorIdType}, mapped: ${sample.hasAuthorMapping})`);
        }
      }
    }
    
    // Assign unmapped posts to Joseph
    for (const postId of unmapped) {
      assignments.push({
        postId: postId,
        authorId: josephUserId,
        method: 'fallback_joseph'
      });
      const count = mappedCount.get(josephUserId) || 0;
      mappedCount.set(josephUserId, count + 1);
    }
    
    // Show assignment statistics
    const wordpressMapped = assignments.filter(a => a.method === 'wordpress').length;
    const studyKazakhstanPrograms = assignments.filter(a => a.method === 'study_kazakhstan_programs').length;
    const fallbackJoseph = assignments.filter(a => a.method === 'fallback_joseph').length;
    
    console.log(`\nAssignment statistics:`);
    console.log(`   ✓ Mapped from WordPress: ${wordpressMapped} posts`);
    console.log(`   ✓ Study-in-Kazakhstan Programs → Abdulraheem: ${studyKazakhstanPrograms} posts`);
    console.log(`   ✓ Fallback to Joseph: ${fallbackJoseph} posts`);
    console.log(`\nAssignment distribution by user:`);
    for (const [userId, count] of mappedCount.entries()) {
      // Find email by user ID
      let email = 'unknown';
      for (const [em, uid] of EMAIL_TO_USER_ID.entries()) {
        if (uid === userId) {
          email = em;
          break;
        }
      }
      const wpCount = assignments.filter(a => a.authorId === userId && a.method === 'wordpress').length;
      const skProgramsCount = assignments.filter(a => a.authorId === userId && a.method === 'study_kazakhstan_programs').length;
      const fallbackCount = assignments.filter(a => a.authorId === userId && a.method === 'fallback_joseph').length;
      const parts = [];
      if (wpCount > 0) parts.push(`${wpCount} from WordPress`);
      if (skProgramsCount > 0) parts.push(`${skProgramsCount} Study-KZ Programs`);
      if (fallbackCount > 0) parts.push(`${fallbackCount} fallback`);
      console.log(`   ${email}: ${count} total (${parts.join(', ')})`);
    }
    
    // Generate SQL
    console.log(`\nGenerating SQL...`);
    const sqlStatements = [];
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- Assign Real Users as Authors to Posts');
    sqlStatements.push(`-- Total posts to update: ${assignments.length}`);
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');
    sqlStatements.push('-- This updates posts that currently have system-user-api as author');
    sqlStatements.push(`-- ${wordpressMapped} posts mapped from WordPress author data`);
    sqlStatements.push(`-- ${studyKazakhstanPrograms} posts (Study-in-Kazakhstan Programs) assigned to Abdulraheem`);
    sqlStatements.push(`-- ${fallbackJoseph} posts assigned to Joseph (no WordPress author data found)`);
    sqlStatements.push('');
    
    // Group by author for better organization
    const byAuthor = new Map();
    for (const assignment of assignments) {
      if (!byAuthor.has(assignment.authorId)) {
        byAuthor.set(assignment.authorId, []);
      }
      byAuthor.get(assignment.authorId).push(assignment.postId);
    }
    
    for (const [authorId, postIds] of byAuthor.entries()) {
      // Find email by user ID
      let email = 'unknown';
      for (const [em, uid] of EMAIL_TO_USER_ID.entries()) {
        if (uid === authorId) {
          email = em;
          break;
        }
      }
      sqlStatements.push(`-- Assigning ${postIds.length} posts to ${email} (${authorId.substring(0, 8)}...)`);
      
      // Update in batches to avoid huge IN clauses
      const batchSize = 100;
      for (let i = 0; i < postIds.length; i += batchSize) {
        const batch = postIds.slice(i, i + batchSize);
        sqlStatements.push(`UPDATE posts`);
        sqlStatements.push(`SET author_id = '${authorId}'`);
        sqlStatements.push(`WHERE id IN (${batch.map(id => `'${id}'`).join(', ')})`);
        sqlStatements.push(`  AND author_id = 'system-user-api';`);
        sqlStatements.push('');
      }
    }
    
    // Write SQL file
    const sqlPath = path.join(__dirname, 'assign-authors-to-posts-with-wordpress.sql');
    const sqlContent = sqlStatements.join('\n');
    
    await fs.writeFile(sqlPath, sqlContent, 'utf-8');
    
    console.log(`\n✅ SQL file generated: ${sqlPath}`);
    console.log(`   Total posts to update: ${assignments.length}`);
    console.log(`   File size: ${sqlContent.length} characters`);
    console.log(`\n   Run it with: npx wrangler d1 execute omni-cms --remote --file=${path.basename(sqlPath)}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
