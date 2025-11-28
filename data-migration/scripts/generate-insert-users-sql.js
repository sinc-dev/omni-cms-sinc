/**
 * Generate SQL INSERT statements for new WordPress users
 * Reads from new-wordpress-users-to-create.csv and generates SQL
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE = path.join(__dirname, 'new-wordpress-users-to-create.csv');
const SQL_FILE = path.join(__dirname, 'insert-new-wordpress-users.sql');

/**
 * Parse CSV line (handles quoted values)
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

async function main() {
  try {
    console.log('============================================================');
    console.log('Generate SQL INSERT Statements for New Users');
    console.log('============================================================\n');
    
    const content = await fs.readFile(CSV_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const header = parseCSVLine(lines[0]);
    
    // Find column indices
    const idIndex = header.indexOf('id');
    const emailIndex = header.indexOf('email');
    const nameIndex = header.indexOf('name');
    const avatarIndex = header.indexOf('avatar_url');
    const isSuperAdminIndex = header.indexOf('is_super_admin');
    const createdAtIndex = header.indexOf('created_at');
    const updatedAtIndex = header.indexOf('updated_at');
    
    if (idIndex < 0 || emailIndex < 0 || nameIndex < 0) {
      throw new Error('Required columns not found in CSV');
    }
    
    const sqlStatements = [];
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('-- Insert New WordPress Users');
    sqlStatements.push(`-- Generated from: ${path.basename(CSV_FILE)}`);
    sqlStatements.push(`-- Total users: ${lines.length - 1}`);
    sqlStatements.push('-- ============================================================================');
    sqlStatements.push('');
    sqlStatements.push('-- Note: Review these before executing!');
    sqlStatements.push('-- Some users like "admin", "scrape-assist" might need special handling');
    sqlStatements.push('');
    
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      
      if (parts.length < 8) continue;
      
      const id = parts[idIndex]?.trim();
      const email = parts[emailIndex]?.trim();
      const name = parts[nameIndex]?.trim().replace(/"/g, ''); // Remove quotes
      const avatarUrl = parts[avatarIndex]?.trim() || '';
      const isSuperAdmin = parts[isSuperAdminIndex]?.trim() || '0';
      const createdAt = parts[createdAtIndex]?.trim();
      const updatedAt = parts[updatedAtIndex]?.trim();
      
      if (!id || !email || !name) continue;
      
      sqlStatements.push(`-- ${name} (${email})`);
      sqlStatements.push(`INSERT INTO users (id, email, name, avatar_url, is_super_admin, created_at, updated_at)`);
      sqlStatements.push(`VALUES (`);
      sqlStatements.push(`  '${id}',`);
      sqlStatements.push(`  '${email}',`);
      sqlStatements.push(`  '${name.replace(/'/g, "''")}',`); // Escape single quotes
      sqlStatements.push(`  ${avatarUrl ? `'${avatarUrl.replace(/'/g, "''")}'` : 'NULL'},`);
      sqlStatements.push(`  ${isSuperAdmin},`);
      sqlStatements.push(`  ${createdAt},`);
      sqlStatements.push(`  ${updatedAt}`);
      sqlStatements.push(`);`);
      sqlStatements.push('');
    }
    
    const sqlContent = sqlStatements.join('\n');
    await fs.writeFile(SQL_FILE, sqlContent, 'utf-8');
    
    console.log(`✅ SQL file generated: ${SQL_FILE}`);
    console.log(`   Total users: ${lines.length - 1}`);
    console.log(`   File size: ${sqlContent.length} characters`);
    console.log(`\n   Review the SQL file, then run:`);
    console.log(`   npx wrangler d1 execute omni-cms --remote --file=${path.basename(SQL_FILE)}`);
    console.log(`\n   ⚠️  Note: Some users like "admin", "scrape-assist" might be system accounts`);
    console.log(`   Consider filtering them out or handling them separately.`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
