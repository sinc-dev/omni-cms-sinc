/**
 * Assign real users as authors to posts
 * 
 * This script:
 * 1. Reads posts CSV to find posts with system-user-api
 * 2. Distributes real users evenly across posts
 * 3. Generates SQL to update posts.author_id
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');

// Real users (excluding system-user-api)
const REAL_USERS = [
  '8074c0461a9cbf572d4a92795adfe2f4', // joseph@studyinnc.com
  '8fc226d2638ad77fd34071c0651a8dc8', // safak@studyinnc.com
  '7e8307e31a9be8356067959e1a5f0837', // grace@studyinnc.com
  '29a6b01446ec648599f7664e28ffa6b6', // jesse@studyinnc.com
  'b916ba076ae2f8c8d5d2c2c4ba432d4a', // abdulraheem@studyinnc.com
  'c9e2c4cb49e709933c4e63dfaf0b4912', // selman@studyinnc.com
  '67ea4f3f459131c602eabd4b69a06b75', // zahra@studyinnc.com
  '42403f0cb94f6bacac904a8aa564527e', // christiane@studyinnc.com
];

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
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Assign Authors to Posts');
    console.log('============================================================\n');
    
    console.log(`Reading posts CSV: ${POSTS_CSV}`);
    const content = await fs.readFile(POSTS_CSV, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const dataLines = lines.slice(1); // Skip header
    
    // Find posts with system-user-api
    const postsToUpdate = [];
    
    for (const line of dataLines) {
      const parts = parseCSVLine(line);
      if (parts.length >= 4) {
        const postId = parts[0]?.trim();
        const authorId = parts[3]?.trim();
        
        if (postId && authorId === 'system-user-api') {
          postsToUpdate.push(postId);
        }
      }
    }
    
    console.log(`   ✓ Found ${postsToUpdate.length} posts with system-user-api`);
    console.log(`   ✓ Available real users: ${REAL_USERS.length}`);
    
    // Distribute users evenly across posts
    const assignments = [];
    for (let i = 0; i < postsToUpdate.length; i++) {
      const userIndex = i % REAL_USERS.length;
      assignments.push({
        postId: postsToUpdate[i],
        authorId: REAL_USERS[userIndex],
      });
    }
    
    // Count assignments per user
    const userCounts = new Map();
    for (const assignment of assignments) {
      const count = userCounts.get(assignment.authorId) || 0;
      userCounts.set(assignment.authorId, count + 1);
    }
    
    console.log(`\nAssignment distribution:`);
    for (const [userId, count] of userCounts.entries()) {
      console.log(`   User ${userId.substring(0, 8)}...: ${count} posts`);
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
    sqlStatements.push('-- Users are distributed evenly across posts');
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
      sqlStatements.push(`-- Assigning ${postIds.length} posts to author ${authorId.substring(0, 8)}...`);
      
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
    const sqlPath = path.join(__dirname, 'assign-authors-to-posts.sql');
    const sqlContent = sqlStatements.join('\n');
    
    await fs.writeFile(sqlPath, sqlContent, 'utf-8');
    
    console.log(`\n✅ SQL file generated: ${sqlPath}`);
    console.log(`   Total posts to update: ${assignments.length}`);
    console.log(`   File size: ${sqlContent.length} characters`);
    console.log(`\n   Run it with: npx wrangler d1 execute omni-cms --remote --file=${sqlPath}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

