/**
 * Fix Inline Media URLs in Blog Posts
 * 
 * Replaces WordPress media URLs in post content with Workers route URLs.
 * 
 * This script:
 * 1. Loads media mappings from all organizations
 * 2. Queries database for posts containing WordPress URLs
 * 3. Matches WordPress filenames to media records
 * 4. Generates SQL UPDATE statements to replace URLs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { apiRequest, getOrganizationId } from '../shared/utils/api-client.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for Workers route (should match APP_URL env var)
const WORKERS_BASE_URL = process.env.APP_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';

// API base URL (for querying posts)
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787';
const API_KEY = process.env.OMNI_CMS_API_KEY || null;

// Organization configuration
const ORGANIZATIONS = [
  {
    slug: 'study-in-north-cyprus',
    name: 'Study in North Cyprus',
    orgId: '3Kyv3hvrybf_YohTZRgPV',
    wordpressDomains: ['studyinnc.com'],
  },
  {
    slug: 'paris-american-international-university',
    name: 'Paris American International University',
    orgId: 'ND-k8iHHx70s5XaW28Mk2',
    wordpressDomains: [], // Add domains if known
  },
  {
    slug: 'study-in-kazakhstan',
    name: 'Study In Kazakhstan',
    orgId: 'IBfLssGjH23-f9uxjH5Ms',
    wordpressDomains: [], // Add domains if known
  },
];

// Helper function to escape SQL strings
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Load media mappings for an organization
 * Returns: Map of WordPress media ID -> R2 fileKey
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
 * Query database for posts containing WordPress URLs
 * Uses wrangler d1 execute to query posts
 */
async function queryPostsWithWordPressUrls(orgId) {
  // Try API first (if available)
  if (API_KEY && API_BASE_URL !== 'http://localhost:8787') {
    try {
      console.log(`    Using API to query posts...`);
      // Query all posts for this organization
      const url = `${API_BASE_URL}/api/admin/v1/organizations/${orgId}/posts?per_page=1000`;
      const data = await apiRequest(url, { apiKey: API_KEY });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Filter posts with WordPress URLs
        const postsWithUrls = data.data.filter(post => 
          post.content && post.content.includes('wp-content/uploads/')
        );
        return postsWithUrls.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
        }));
      }
    } catch (error) {
      console.warn(`    ⚠ API query failed: ${error.message}`);
      // Fall through to wrangler method
    }
  }

  // Fallback to wrangler (text output parsing)
  const tempSqlFile = path.join(__dirname, `temp-query-${Date.now()}.sql`);
  const sql = `SELECT id, content, title
FROM posts
WHERE organization_id = '${orgId}'
  AND (content LIKE '%wp-content/uploads/%' OR content LIKE '%r2.cloudflarestorage.com%')
ORDER BY id;`;

  try {
    await fs.writeFile(tempSqlFile, sql, 'utf-8');
    
    // Use wrangler WITHOUT --json to get table output
    const { stdout } = await execAsync(
      `npx wrangler d1 execute omni-cms --remote --file="${tempSqlFile}" 2>&1`
    );
    
    await fs.unlink(tempSqlFile).catch(() => {});
    
    // Parse table output - look for data rows between │ characters
    const lines = stdout.split('\n');
    const posts = [];
    let inTable = false;
    let headers = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect table start (header row with │)
      if (line.includes('│') && line.includes('id')) {
        inTable = true;
        headers = line.split('│').map(h => h.trim().toLowerCase()).filter(h => h);
        continue;
      }
      
      // Detect table end
      if (inTable && (line.startsWith('└') || line.startsWith('═'))) {
        break;
      }
      
      // Parse data rows
      if (inTable && line.includes('│') && !line.includes('─') && !line.includes('═')) {
        const values = line.split('│').map(v => v.trim()).filter(v => v);
        if (values.length >= 3) {
          // Map values to headers
          const post = {};
          headers.forEach((header, idx) => {
            if (values[idx] !== undefined) {
              post[header] = values[idx];
            }
          });
          
          // Ensure we have required fields
          if (post.id && post.content && post.title !== undefined) {
            posts.push({
              id: post.id,
              title: post.title,
              content: post.content,
            });
          }
        }
      }
    }
    
    return posts.length > 0 ? posts : [];
  } catch (error) {
    await fs.unlink(tempSqlFile).catch(() => {});
    console.warn(`  ⚠ Could not query database: ${error.message}`);
    return null;
  }
}

/**
 * Query database for media records by filename
 */
async function queryMediaByFilename(orgId, filename) {
  // Create a temporary SQL file for the query
  const tempSqlFile = path.join(__dirname, `temp-media-query-${Date.now()}.sql`);
  const sql = `SELECT id, file_key, filename
FROM media
WHERE organization_id = '${orgId}'
  AND filename LIKE '%${filename.replace(/'/g, "''")}%'
LIMIT 1;`;

  try {
    // Write SQL to temp file
    await fs.writeFile(tempSqlFile, sql, 'utf-8');
    
    // Use wrangler d1 execute WITHOUT --json to get text output
    const { stdout } = await execAsync(
      `npx wrangler d1 execute omni-cms --remote --file="${tempSqlFile}" 2>&1`
    );
    
    // Clean up temp file
    await fs.unlink(tempSqlFile).catch(() => {});
    
    // Parse text output
    const lines = stdout.split('\n');
    let headersFound = false;
    let headerLineIndex = -1;
    
    // Find the header row
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('│') && (line.includes('id') || line.includes('file_key'))) {
        headersFound = true;
        headerLineIndex = i;
        break;
      }
    }
    
    if (!headersFound) {
      // Try JSON parsing as fallback
      const jsonMatch = stdout.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          if (Array.isArray(result) && result.length > 0 && result[0].results && result[0].results.length > 0) {
            return result[0].results[0];
          }
        } catch (e) {
          // JSON parsing failed
        }
      }
      return null;
    }
    
    // Parse first data row
    for (let i = headerLineIndex + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || !line.includes('│')) continue;
      if (line.startsWith('└') || line.startsWith('├')) break;
      
      const values = line.split('│').map(v => v.trim()).filter(v => v);
      if (values.length >= 3) {
        return {
          id: values[0],
          file_key: values[1],
          filename: values[2],
        };
      }
    }
    
    return null;
  } catch (error) {
    // Clean up temp file on error
    await fs.unlink(tempSqlFile).catch(() => {});
    return null;
  }
}

/**
 * Extract fileKey from R2 URL or filename from WordPress URL
 */
function extractFileKeyOrFilename(url) {
  try {
    // Check if it's an R2 URL
    const r2Match = url.match(/https?:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/([^\/\?]+)/i);
    if (r2Match) {
      return r2Match[1]; // Return fileKey directly
    }
    
    // Otherwise, treat as WordPress URL
    // Remove query parameters and hash
    const cleanUrl = url.split('?')[0].split('#')[0];
    
    // Extract filename (last part after last slash)
    const parts = cleanUrl.split('/');
    const filename = parts[parts.length - 1];
    
    // Remove common WordPress image size suffixes (e.g., -300x200.jpg)
    const filenameWithoutSize = filename.replace(/-\d+x\d+\.(jpg|jpeg|png|gif|webp)$/i, '.$1');
    
    return filenameWithoutSize || filename;
  } catch (error) {
    return null;
  }
}

/**
 * Check if URL is an R2 URL
 */
function isR2Url(url) {
  return /https?:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\//i.test(url);
}

/**
 * Extract R2 URLs and WordPress URLs from HTML content
 */
function extractMediaUrls(content, wordpressDomains) {
  const urls = new Set();
  
  // Ensure content is a string
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // Pattern to match direct R2 URLs
  // Matches: https://9a2b6956cc47f63e13beb91af5363970.r2.cloudflarestorage.com/fileKey.jpg?variant=...
  const r2Pattern = /https?:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com\/[^"'\s<>?]+(?:\?[^"'\s<>]*)?/gi;
  
  // Pattern to match WordPress media URLs
  // Matches: https://domain.com/wp-content/uploads/... or /wp-content/uploads/...
  const wpPatterns = [
    // Absolute URLs with domain
    ...(wordpressDomains || []).map(domain => 
      new RegExp(`https?://${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/wp-content/uploads/[^"'\s<>]+`, 'gi')
    ),
    // Relative URLs
    /\/wp-content\/uploads\/[^"'\s<>]+/gi,
    // Any domain with wp-content/uploads
    /https?:\/\/[^"'\s<>]+\/wp-content\/uploads\/[^"'\s<>]+/gi,
  ];

  // Extract R2 URLs
  const r2Matches = content.match(r2Pattern);
  if (r2Matches) {
    r2Matches.forEach(url => urls.add(url));
  }

  // Extract WordPress URLs
  for (const pattern of wpPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(url => urls.add(url));
    }
  }

  return Array.from(urls);
}

/**
 * Replace R2 URLs and WordPress URLs in content with Workers route URLs
 */
async function replaceUrlsInContent(content, orgId, wordpressDomains, mediaMappings) {
  let updatedContent = content;
  const replacements = [];
  const mediaUrls = extractMediaUrls(content, wordpressDomains);

  if (mediaUrls.length > 0) {
    console.log(`    Found ${mediaUrls.length} media URL(s) to process`);
  }

  for (const url of mediaUrls) {
    // Check if it's an R2 URL (direct replacement)
    if (isR2Url(url)) {
      const fileKey = extractFileKeyOrFilename(url);
      if (!fileKey) continue;
      
      // Extract query parameters (e.g., ?variant=thumbnail)
      const urlObj = new URL(url);
      const queryParams = urlObj.search;
      
      // Build new Workers route URL
      const newUrl = `${WORKERS_BASE_URL}/api/public/v1/media/${fileKey}${queryParams}`;
      
      // Replace all occurrences of this R2 URL
      const regex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      updatedContent = updatedContent.replace(regex, newUrl);
      
      replacements.push({
        oldUrl: url,
        newUrl,
        fileKey,
        type: 'r2',
      });
      
      continue;
    }
    
    // Otherwise, treat as WordPress URL
    const filename = extractFileKeyOrFilename(url);
    if (!filename) continue;

    // Try to find media record by filename
    let mediaRecord = await queryMediaByFilename(orgId, filename);
    
    // If not found, try without extension variations
    if (!mediaRecord) {
      const baseFilename = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      mediaRecord = await queryMediaByFilename(orgId, baseFilename);
    }

    if (mediaRecord && mediaRecord.file_key) {
      const newUrl = `${WORKERS_BASE_URL}/api/public/v1/media/${mediaRecord.file_key}`;
      
      // Replace all occurrences of this WordPress URL
      const regex = new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      updatedContent = updatedContent.replace(regex, newUrl);
      
      replacements.push({
        oldUrl: url,
        newUrl,
        filename,
        mediaId: mediaRecord.id,
        fileKey: mediaRecord.file_key,
        type: 'wordpress',
      });
    } else {
      console.warn(`    ⚠ Could not find media record for: ${filename}`);
    }
  }

  return { updatedContent, replacements };
}

/**
 * Generate SQL UPDATE statements
 */
function generateSqlUpdates(posts, orgName) {
  let sql = '';
  
  sql += `-- ============================================================\n`;
  sql += `-- ${orgName}\n`;
  sql += `-- ============================================================\n\n`;

  for (const post of posts) {
    if (post.replacements && post.replacements.length > 0) {
      sql += `-- Post: ${post.title} (ID: ${post.id})\n`;
      sql += `-- Replacing ${post.replacements.length} WordPress URL(s)\n`;
      sql += `UPDATE posts SET content = ${escapeSql(post.updatedContent)} WHERE id = ${escapeSql(post.id)};\n\n`;
    }
  }

  return sql;
}

/**
 * Main function
 */
async function main() {
  console.log('Fix Inline Media URLs in Blog Posts\n');
  console.log(`Workers Base URL: ${WORKERS_BASE_URL}\n`);

  const sqlFile = path.join(__dirname, 'fix-inline-media-urls.sql');
  let sqlContent = '';
  
  sqlContent += '-- Fix Inline Media URLs in Blog Posts\n';
  sqlContent += '-- Replaces WordPress URLs with Workers route URLs\n';
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Workers Base URL: ${WORKERS_BASE_URL}\n`;
  sqlContent += '\n';
  sqlContent += '-- Before running, backup your database!\n';
  sqlContent += '-- Review all UPDATE statements carefully\n';
  sqlContent += '\n';

  let totalPostsProcessed = 0;
  let totalReplacements = 0;

  // Process each organization
  for (const org of ORGANIZATIONS) {
    console.log(`\nProcessing ${org.name}...`);
    
    // Load media mappings
    const mediaMappings = await loadMediaMappings(org.slug);
    console.log(`  Loaded ${Object.keys(mediaMappings).length} media mappings`);

    // Query posts with WordPress URLs
    const posts = await queryPostsWithWordPressUrls(org.orgId);
    
    if (posts === null) {
      // Can't query directly, generate SQL to find posts instead
      console.log(`  ⚠ Cannot query database directly. Generating SQL queries instead.`);
      sqlContent += `-- ============================================================\n`;
      sqlContent += `-- ${org.name} (${org.slug})\n`;
      sqlContent += `-- ============================================================\n\n`;
      sqlContent += `-- Find posts with WordPress URLs:\n`;
      sqlContent += `SELECT id, title, content\n`;
      sqlContent += `FROM posts\n`;
      sqlContent += `WHERE organization_id = '${org.orgId}'\n`;
      sqlContent += `  AND content LIKE '%wp-content/uploads/%';\n\n`;
      sqlContent += `-- Manually process these posts and generate UPDATE statements\n`;
      sqlContent += `-- Or run this script with wrangler d1 access\n\n`;
      continue;
    }

    if (posts.length === 0) {
      console.log(`  ✓ No posts found with WordPress URLs`);
      continue;
    }

    console.log(`  Found ${posts.length} posts with WordPress URLs`);

    // Process each post
    const processedPosts = [];
    for (const post of posts) {
      if (!post.content) {
        console.log(`    ⚠ Post "${post.title}" has no content, skipping`);
        continue;
      }

      console.log(`    Processing post: "${post.title}" (ID: ${post.id})`);
      const { updatedContent, replacements } = await replaceUrlsInContent(
        post.content,
        org.orgId,
        org.wordpressDomains,
        mediaMappings
      );

      if (replacements.length > 0) {
        processedPosts.push({
          ...post,
          updatedContent,
          replacements,
        });
        totalReplacements += replacements.length;
        console.log(`    ✓ Post "${post.title}": ${replacements.length} URL(s) replaced`);
      } else {
        console.log(`    ⚠ Post "${post.title}": No URLs replaced (URLs may not match media records)`);
      }
    }

    totalPostsProcessed += processedPosts.length;

    // Generate SQL for this organization
    sqlContent += generateSqlUpdates(processedPosts, org.name);
  }

  // Add summary and verification queries
  sqlContent += '-- ============================================================\n';
  sqlContent += '-- Summary\n';
  sqlContent += '-- ============================================================\n';
  sqlContent += `-- Total posts updated: ${totalPostsProcessed}\n`;
  sqlContent += `-- Total URL replacements: ${totalReplacements}\n`;
  sqlContent += '\n';
  sqlContent += '-- Verification: Check for remaining WordPress URLs\n';
  sqlContent += 'SELECT id, title, content\n';
  sqlContent += 'FROM posts\n';
  sqlContent += "WHERE content LIKE '%wp-content/uploads/%'\n";
  sqlContent += 'ORDER BY id;\n';

  // Write SQL file
  await fs.writeFile(sqlFile, sqlContent, 'utf-8');

  console.log(`\n✅ SQL file generated: ${sqlFile}`);
  console.log(`\nSummary:`);
  console.log(`  Posts processed: ${totalPostsProcessed}`);
  console.log(`  URL replacements: ${totalReplacements}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated SQL file`);
  console.log(`2. Run: npx wrangler d1 execute omni-cms --remote --file=${sqlFile}`);
  console.log(`3. Verify no WordPress URLs remain in post content`);
}

main().catch(console.error);

