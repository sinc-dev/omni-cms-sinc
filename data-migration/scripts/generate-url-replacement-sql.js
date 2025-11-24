/**
 * Generate SQL for WordPress URL Replacement
 * 
 * This script generates SQL UPDATE statements to replace WordPress URLs
 * with Workers route URLs. It uses SQL string functions to do the replacements
 * directly in the database.
 * 
 * Run this to generate the SQL file, then review and execute it.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for Workers route (should match APP_URL env var)
const WORKERS_BASE_URL = process.env.APP_URL || 'https://omni-cms-api.joseph-9a2.workers.dev';

// Organization configuration
const ORGANIZATIONS = [
  {
    slug: 'study-in-north-cyprus',
    name: 'Study in North Cyprus',
    orgId: '3Kyv3hvrybf_YohTZRgPV',
    wordpressDomain: 'studyinnc.com',
  },
  {
    slug: 'paris-american-international-university',
    name: 'Paris American International University',
    orgId: 'ND-k8iHHx70s5XaW28Mk2',
    wordpressDomain: null, // Add if known
  },
  {
    slug: 'study-in-kazakhstan',
    name: 'Study In Kazakhstan',
    orgId: 'IBfLssGjH23-f9uxjH5Ms',
    wordpressDomain: null, // Add if known
  },
];

/**
 * Generate SQL to find and replace WordPress URLs
 * This uses SQL string replacement functions to do the work directly in the database
 */
function generateReplacementSql(orgId, wordpressDomain, workersBaseUrl) {
  let sql = '';
  
  if (!wordpressDomain) {
    sql += `-- WordPress domain not configured for this organization\n`;
    sql += `-- Manual replacement needed\n\n`;
    return sql;
  }

  // SQL to replace WordPress URLs with Workers URLs
  // This uses SQLite's REPLACE function to do string replacement
  // Pattern: https://domain.com/wp-content/uploads/... -> {workersBaseUrl}/api/public/v1/media/{fileKey}
  
  sql += `-- Replace WordPress URLs for ${wordpressDomain}\n`;
  sql += `-- This will replace URLs in post content\n\n`;
  
  // First, let's create a query to see what we're working with
  sql += `-- Step 1: Find posts with WordPress URLs\n`;
  sql += `SELECT id, title, \n`;
  sql += `  LENGTH(content) - LENGTH(REPLACE(content, 'wp-content/uploads/', '')) as url_count\n`;
  sql += `FROM posts\n`;
  sql += `WHERE organization_id = '${orgId}'\n`;
  sql += `  AND content LIKE '%wp-content/uploads/%'\n`;
  sql += `ORDER BY url_count DESC;\n\n`;
  
  // Note: Direct SQL replacement is complex because we need to:
  // 1. Extract the filename from WordPress URL
  // 2. Look up the fileKey in the media table
  // 3. Replace the URL
  
  // For now, generate a template that requires manual processing or API usage
  sql += `-- Step 2: Manual replacement required\n`;
  sql += `-- The script fix-inline-media-urls.js can be used to generate specific UPDATE statements\n`;
  sql += `-- by querying the database and matching filenames to media records\n\n`;
  
  return sql;
}

async function main() {
  console.log('Generate SQL for WordPress URL Replacement\n');
  console.log(`Workers Base URL: ${WORKERS_BASE_URL}\n`);

  const sqlFile = path.join(__dirname, 'fix-inline-media-urls-generated.sql');
  let sqlContent = '';
  
  sqlContent += '-- Fix Inline Media URLs in Blog Posts\n';
  sqlContent += '-- Replaces WordPress URLs with Workers route URLs\n';
  sqlContent += `-- Generated: ${new Date().toISOString()}\n`;
  sqlContent += `-- Workers Base URL: ${WORKERS_BASE_URL}\n`;
  sqlContent += '\n';
  sqlContent += '-- IMPORTANT: Review all statements before executing!\n';
  sqlContent += '-- Backup your database first!\n';
  sqlContent += '\n';

  // Process each organization
  for (const org of ORGANIZATIONS) {
    console.log(`Processing ${org.name}...`);
    sqlContent += `-- ============================================================\n`;
    sqlContent += `-- ${org.name} (${org.slug})\n`;
    sqlContent += `-- ============================================================\n\n`;
    
    sqlContent += generateReplacementSql(org.orgId, org.wordpressDomain, WORKERS_BASE_URL);
  }

  // Add verification query
  sqlContent += '-- ============================================================\n';
  sqlContent += '-- Verification: Check for remaining WordPress URLs\n';
  sqlContent += '-- ============================================================\n';
  sqlContent += 'SELECT id, title, \n';
  sqlContent += '  LENGTH(content) - LENGTH(REPLACE(content, \'wp-content/uploads/\', \'\')) as remaining_urls\n';
  sqlContent += 'FROM posts\n';
  sqlContent += "WHERE content LIKE '%wp-content/uploads/%'\n";
  sqlContent += 'ORDER BY remaining_urls DESC;\n';

  // Write SQL file
  await fs.writeFile(sqlFile, sqlContent, 'utf-8');

  console.log(`\n✅ SQL file generated: ${sqlFile}`);
  console.log(`\nNote: This SQL file contains queries to find posts with WordPress URLs.`);
  console.log(`To generate actual UPDATE statements, run: node fix-inline-media-urls.js`);
  console.log(`(This requires database access via wrangler)`);
}

main().catch(console.error);

