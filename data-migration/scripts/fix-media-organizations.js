/**
 * Fix Media Organization Assignments
 * 
 * Reads media mapping files from each organization and generates SQL UPDATE statements
 * to reassign media files to their correct organizations.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Organization configuration
const ORGANIZATIONS = [
  {
    slug: 'paris-american-international-university',
    name: 'Paris American International University',
    orgId: 'ND-k8iHHx70s5XaW28Mk2',
  },
  {
    slug: 'study-in-kazakhstan',
    name: 'Study In Kazakhstan',
    orgId: 'IBfLssGjH23-f9uxjH5Ms',
  },
  {
    slug: 'study-in-north-cyprus',
    name: 'Study in North Cyprus',
    orgId: '3Kyv3hvrybf_YohTZRgPV',
  },
];

// Helper function
function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Load media mappings for an organization
 */
async function loadMediaMappings(orgSlug) {
  const mappingPath = path.join(__dirname, `../organizations/${orgSlug}/import-mappings/media.json`);
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const mappings = JSON.parse(content);
    // Extract Omni-CMS media IDs (values in the JSON)
    return Object.values(mappings);
  } catch (error) {
    console.warn(`  ⚠ Could not load media mappings for ${orgSlug}: ${error.message}`);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Generating SQL to fix media organization assignments...\n');

  const sqlFile = path.join(__dirname, 'fix-media-organizations.sql');
  let sqlContent = '';
  
  // Header
  sqlContent += '-- Fix Media Organization Assignments\n';
  sqlContent += '-- Generated from import-mappings/media.json files\n';
  sqlContent += '-- This script reassigns media files to their correct organizations\n';
  sqlContent += '\n';
  sqlContent += '-- Before running, verify media counts:\n';
  sqlContent += '-- SELECT organization_id, COUNT(*) as count FROM media GROUP BY organization_id;\n';
  sqlContent += '\n';

  // Process each organization
  for (const org of ORGANIZATIONS) {
    console.log(`Processing ${org.name}...`);
    
    const mediaIds = await loadMediaMappings(org.slug);
    
    if (mediaIds.length === 0) {
      console.log(`  ⚠ No media mappings found, skipping`);
      continue;
    }

    console.log(`  Found ${mediaIds.length} media IDs`);

    // Generate UPDATE statements
    sqlContent += `-- ============================================================\n`;
    sqlContent += `-- ${org.name} (${org.slug})\n`;
    sqlContent += `-- ============================================================\n`;
    sqlContent += `-- Updating ${mediaIds.length} media files\n`;
    sqlContent += '\n';

    for (const mediaId of mediaIds) {
      sqlContent += `UPDATE media SET organization_id = ${escapeSql(org.orgId)} WHERE id = ${escapeSql(mediaId)};\n`;
    }

    sqlContent += '\n';
    console.log(`  ✓ Generated ${mediaIds.length} UPDATE statements\n`);
  }

  // Add verification queries
  sqlContent += '-- ============================================================\n';
  sqlContent += '-- Verification Queries\n';
  sqlContent += '-- ============================================================\n';
  sqlContent += '\n';
  sqlContent += '-- Check media counts per organization after update:\n';
  sqlContent += 'SELECT o.name, COUNT(m.id) as media_count\n';
  sqlContent += 'FROM organizations o\n';
  sqlContent += 'LEFT JOIN media m ON m.organization_id = o.id\n';
  sqlContent += 'GROUP BY o.id, o.name\n';
  sqlContent += 'ORDER BY o.name;\n';
  sqlContent += '\n';
  sqlContent += '-- Total media count:\n';
  sqlContent += 'SELECT COUNT(*) as total_media FROM media;\n';

  // Write SQL file
  await fs.writeFile(sqlFile, sqlContent, 'utf-8');

  console.log(`\n✅ SQL file generated: ${sqlFile}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated SQL file`);
  console.log(`2. Run: npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/fix-media-organizations.sql`);
  console.log(`3. Verify media counts per organization`);
}

main().catch(console.error);

