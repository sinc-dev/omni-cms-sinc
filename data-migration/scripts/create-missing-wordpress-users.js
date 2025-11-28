/**
 * Create missing WordPress users in the database
 * 
 * This script:
 * 1. Reads WordPress authors from raw-data/authors.json files
 * 2. Checks which authors don't exist in the database (by email)
 * 3. Generates a CSV with new users to create
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const OUTPUT_CSV = path.join(__dirname, 'new-wordpress-users-to-create.csv');

// Existing user emails (from database or provided)
const EXISTING_USER_EMAILS = new Set([
  'api@system.local',
  'abdulraheem@studyinnc.com',
  'joseph@studyinnc.com',
  'safak@studyinnc.com',
  'grace@studyinnc.com',
  'jesse@studyinnc.com',
  'selman@studyinnc.com',
  'zahra@studyinnc.com',
  'christiane@studyinnc.com'
]);

// Users that are the same person across organizations (slug -> existing email)
// These should not be created as separate users
const CROSS_ORG_USERS = {
  'joseph': 'joseph@studyinnc.com',
  'grace': 'grace@studyinnc.com',
  'abdulraheem': 'abdulraheem@studyinnc.com',
  'safak': 'safak@studyinnc.com',
  'selman': 'selman@studyinnc.com'
};

/**
 * Generate a user ID (similar to existing format)
 */
function generateUserId() {
  return randomBytes(16).toString('hex');
}

/**
 * Generate email from author slug and organization domain
 */
function generateEmailFromSlug(slug, orgSlug) {
  const domainMap = {
    'study-in-north-cyprus': 'studyinnc.com',
    'study-in-kazakhstan': 'studyinkzk.com',
    'paris-american-international-university': 'parisamerican.org'
  };
  
  const domain = domainMap[orgSlug] || 'studyinnc.com';
  return `${slug}@${domain}`;
}

/**
 * Load existing users from CSV if available
 */
async function loadExistingUsers() {
  const usersCsvPath = path.join(CSV_DIR, 'users.csv');
  try {
    const content = await fs.readFile(usersCsvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const header = lines[0]?.split(',');
    const emailIndex = header?.indexOf('email');
    
    if (emailIndex >= 0) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        const email = parts[emailIndex]?.trim();
        if (email) {
          EXISTING_USER_EMAILS.add(email.toLowerCase());
        }
      }
      console.log(`   ✓ Loaded ${EXISTING_USER_EMAILS.size} existing user emails from CSV`);
    }
  } catch (error) {
    // CSV doesn't exist, use hardcoded list
    console.log(`   ✓ Using ${EXISTING_USER_EMAILS.size} hardcoded user emails`);
  }
}

/**
 * Load WordPress posts with author data
 */
async function loadWordPressPostAuthors() {
  const orgsDir = path.join(__dirname, '..', 'organizations');
  const organizations = ['study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university'];
  
  const authorsWithPosts = new Set(); // wpAuthorId -> true (if has posts)
  
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
              if (post.author) {
                const wpAuthorId = typeof post.author === 'object' ? post.author.id : post.author;
                authorsWithPosts.add(`${orgSlug}:${wpAuthorId}`);
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
  
  return authorsWithPosts;
}

/**
 * Load WordPress authors from all organizations
 */
async function loadWordPressAuthors(authorsWithPosts) {
  const orgsDir = path.join(__dirname, '..', 'organizations');
  const organizations = ['study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university'];
  
  const allAuthors = new Map(); // email -> { name, slug, org, wpId }
  let authorsWithoutPosts = 0;
  
  for (const orgSlug of organizations) {
    const orgDir = path.join(orgsDir, orgSlug);
    const authorsPath = path.join(orgDir, 'raw-data', 'authors.json');
    
    try {
      const content = await fs.readFile(authorsPath, 'utf-8');
      const authors = JSON.parse(content);
      
      for (const author of authors) {
        const slug = author.slug?.toLowerCase().trim();
        const name = author.name?.trim() || slug || 'Unknown';
        
        if (!slug) continue;
        
        // Check if this author has posts
        const authorKey = `${orgSlug}:${author.id}`;
        if (!authorsWithPosts.has(authorKey)) {
          authorsWithoutPosts++;
          continue; // Skip authors without posts
        }
        
        // Check if this is a cross-org user (same person across organizations)
        if (CROSS_ORG_USERS[slug]) {
          const existingEmail = CROSS_ORG_USERS[slug];
          if (EXISTING_USER_EMAILS.has(existingEmail)) {
            // User already exists, skip creating duplicate
            continue;
          }
        }
        
        // Try to generate email from slug
        const email = generateEmailFromSlug(slug, orgSlug);
        const emailLower = email.toLowerCase();
        
        // Only add if not already exists
        if (!allAuthors.has(emailLower)) {
          allAuthors.set(emailLower, {
            email: emailLower,
            name: name,
            slug: slug,
            organization: orgSlug,
            wpAuthorId: author.id,
            source: 'wordpress'
          });
        }
      }
      
      console.log(`   ✓ ${orgSlug}: Found ${authors.length} WordPress authors`);
    } catch (error) {
      console.log(`   ⚠ ${orgSlug}: Could not load authors (${error.message})`);
    }
  }
  
  if (authorsWithoutPosts > 0) {
    console.log(`   ⚠ Skipped ${authorsWithoutPosts} authors without posts`);
  }
  
  return allAuthors;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Create Missing WordPress Users');
    console.log('============================================================\n');
    
    // Load existing users
    await loadExistingUsers();
    
    // First, find which authors have posts
    console.log('\nChecking which WordPress authors have posts...');
    const authorsWithPosts = await loadWordPressPostAuthors();
    console.log(`   ✓ Found ${authorsWithPosts.size} unique author-organization pairs with posts`);
    
    // Load WordPress authors (only those with posts)
    console.log('\nLoading WordPress authors (with posts only)...');
    const wpAuthors = await loadWordPressAuthors(authorsWithPosts);
    
    console.log(`   ✓ Total unique WordPress authors: ${wpAuthors.size}`);
    
    // Filter out existing users
    const newUsers = [];
    for (const [email, author] of wpAuthors.entries()) {
      if (!EXISTING_USER_EMAILS.has(email)) {
        newUsers.push({
          id: generateUserId(),
          email: author.email,
          name: author.name,
          avatar_url: '',
          is_super_admin: 0,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          // Metadata
          wp_author_id: author.wpAuthorId,
          wp_slug: author.slug,
          organization: author.organization
        });
      }
    }
    
    console.log(`\n   ✓ Found ${newUsers.length} new users to create`);
    console.log(`   ✓ ${wpAuthors.size - newUsers.length} users already exist`);
    
    if (newUsers.length === 0) {
      console.log('\n✅ No new users to create!');
      return;
    }
    
    // Generate CSV
    const csvLines = [];
    csvLines.push('id,email,name,avatar_url,is_super_admin,created_at,updated_at,wp_author_id,wp_slug,organization');
    
    for (const user of newUsers) {
      const line = [
        user.id,
        user.email,
        `"${user.name.replace(/"/g, '""')}"`, // Escape quotes in name
        user.avatar_url || '',
        user.is_super_admin,
        user.created_at,
        user.updated_at,
        user.wp_author_id,
        user.wp_slug,
        user.organization
      ];
      csvLines.push(line.join(','));
    }
    
    const csvContent = csvLines.join('\n');
    await fs.writeFile(OUTPUT_CSV, csvContent, 'utf-8');
    
    console.log(`\n✅ CSV file generated: ${OUTPUT_CSV}`);
    console.log(`   Total new users: ${newUsers.length}`);
    console.log(`\n   Preview of first 10 users:`);
    for (let i = 0; i < Math.min(10, newUsers.length); i++) {
      const user = newUsers[i];
      console.log(`     ${user.email} - ${user.name} (from ${user.organization})`);
    }
    
    if (newUsers.length > 10) {
      console.log(`     ... and ${newUsers.length - 10} more`);
    }
    
    console.log(`\n   Review the CSV file, then you can:`);
    console.log(`   1. Import it into the database`);
    console.log(`   2. Or generate SQL INSERT statements`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
