/**
 * Update wp-media Placeholders to Actual Media IDs
 * 
 * This script:
 * 1. Loads media mappings from import-mappings/media.json files for all organizations
 * 2. Queries database for all post_field_values with wp-media-* placeholders
 * 3. Maps placeholders to actual media IDs using the mappings
 * 4. Verifies media IDs exist in media table
 * 5. Generates SQL to UPDATE post_field_values.value from placeholder to actual media ID
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const ORGANIZATIONS_DIR = path.join(__dirname, '..', 'organizations');
const OUTPUT_SQL = path.join(__dirname, 'update-wp-media-placeholders.sql');

/**
 * Load media mapping from an organization's import-mappings/media.json
 */
async function loadMediaMapping(orgSlug) {
  const mappingPath = path.join(ORGANIZATIONS_DIR, orgSlug, 'import-mappings', 'media.json');
  
  try {
    const content = await fs.readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(content);
    // Convert to Map: wpMediaId (number) -> omniMediaId (string)
    const mediaMap = new Map();
    for (const [wpId, omniId] of Object.entries(mapping)) {
      mediaMap.set(parseInt(wpId), omniId);
    }
    return mediaMap;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`   ⚠ No media mapping found for ${orgSlug}`);
      return new Map();
    }
    throw error;
  }
}

/**
 * Load all media mappings from all organizations
 */
async function loadAllMediaMappings() {
  console.log('Loading media mappings from all organizations...');
  
  const orgs = ['paris-american-international-university', 'study-in-kazakhstan', 'study-in-north-cyprus'];
  const allMappings = new Map();
  
  for (const orgSlug of orgs) {
    const mapping = await loadMediaMapping(orgSlug);
    console.log(`   ✓ ${orgSlug}: ${mapping.size} media mappings`);
    
    // Merge into allMappings (wpId -> { omniId, orgSlug })
    for (const [wpId, omniId] of mapping.entries()) {
      allMappings.set(wpId, { omniId, orgSlug });
    }
  }
  
  return allMappings;
}

/**
 * Query database for all wp-media placeholders
 * Uses CSV export approach for better reliability
 */
async function getWpMediaPlaceholders() {
  console.log('Querying database for wp-media placeholders...');
  
  // Check if CSV export exists, otherwise create SQL file for user to export
  const csvPath = path.join(__dirname, 'wp-media-placeholders-export.csv');
  
  try {
    // Try to read CSV if it exists
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    console.log('   ✓ Found existing CSV export, reading...');
    return parseCSV(csvContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // CSV doesn't exist, create SQL file for user to export
      const exportSql = `
SELECT 
  pfv.id as value_id,
  pfv.post_id,
  pfv.custom_field_id,
  pfv.value,
  p.id as post_id,
  o.slug as org_slug,
  o.id as org_id,
  pt.slug as post_type_slug
FROM post_field_values pfv
INNER JOIN posts p ON pfv.post_id = p.id
INNER JOIN organizations o ON p.organization_id = o.id
INNER JOIN post_types pt ON p.post_type_id = pt.id
WHERE pfv.value LIKE 'wp-media-%'
ORDER BY o.slug, p.id;
      `.trim();
      
      const exportSqlPath = path.join(__dirname, 'export-wp-media-placeholders.sql');
      await fs.writeFile(exportSqlPath, exportSql, 'utf-8');
      
      throw new Error(`CSV file not found: ${csvPath}\n\nPlease run this SQL in D1 and save as wp-media-placeholders-export.csv:\n\n${exportSql}\n\nOr use:\n  npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/export-wp-media-placeholders.sql\n\nThen save the output as: data-migration/scripts/wp-media-placeholders-export.csv`);
    }
    throw error;
  }
}

/**
 * Parse CSV content
 */
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Parse header
  const header = lines[0].split(',').map(h => h.trim());
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== header.length) continue;
    
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] || '';
    }
    data.push(row);
  }
  
  return data;
}

/**
 * Verify media ID exists in media table (batch check)
 * Uses direct SQL query with better error handling
 */
async function verifyMediaIdsExist(mediaIds) {
  if (mediaIds.length === 0) return new Set();
  
  // Batch in groups of 100 to avoid SQL limits
  const batchSize = 100;
  const allExisting = new Set();
  
  for (let i = 0; i < mediaIds.length; i += batchSize) {
    const batch = mediaIds.slice(i, i + batchSize);
    const sql = `SELECT id FROM media WHERE id IN (${batch.map(id => `'${id}'`).join(',')})`;
    
    const tempFile = path.join(__dirname, 'temp-verify-media.sql');
    await fs.writeFile(tempFile, sql, 'utf-8');
    
    try {
      const command = `cd "${PROJECT_ROOT}" && npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/temp-verify-media.sql --json`;
      const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
      
      // Parse JSON - handle multi-line
      const lines = output.trim().split('\n');
      let jsonStr = '';
      let inJson = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          inJson = true;
          jsonStr = trimmed;
        } else if (inJson) {
          jsonStr += trimmed;
          // Check if complete
          if (trimmed.endsWith(']') || trimmed.endsWith('}')) {
            try {
              JSON.parse(jsonStr);
              break;
            } catch (e) {
              // Continue building
            }
          }
        }
      }
      
      if (jsonStr) {
        try {
          const result = JSON.parse(jsonStr);
          const data = Array.isArray(result) && result[0]?.results ? result[0].results : [];
          data.forEach(row => allExisting.add(row.id));
        } catch (e) {
          // Skip this batch if JSON parse fails
        }
      }
      
      try {
        await fs.unlink(tempFile);
      } catch (e) {}
    } catch (error) {
      try {
        await fs.unlink(tempFile);
      } catch (e) {}
      // Continue with next batch
    }
  }
  
  return allExisting;
}

/**
 * Generate SQL to update wp-media placeholders
 */
async function generateUpdateSQL(placeholders, mediaMappings) {
  const sqlStatements = [];
  
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Update wp-media Placeholders to Actual Media IDs');
  sqlStatements.push(`-- Total placeholders found: ${placeholders.length}`);
  sqlStatements.push('-- Generated from import-mappings/media.json files');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Note: D1 executes each statement atomically, no transaction needed');
  sqlStatements.push('');
  
  const updates = [];
  const notFound = [];
  
  // Process each placeholder
  for (const placeholder of placeholders) {
    const value = placeholder.value;
    if (!value.startsWith('wp-media-')) continue;
    
    // Extract WordPress media ID
    const wpMediaId = parseInt(value.replace('wp-media-', ''));
    if (isNaN(wpMediaId)) {
      notFound.push({ ...placeholder, reason: 'invalid_format' });
      continue;
    }
    
    // Look up in mappings
    const mapping = mediaMappings.get(wpMediaId);
    if (!mapping) {
      notFound.push({ ...placeholder, wpMediaId, reason: 'no_mapping' });
      continue;
    }
    
    const omniMediaId = mapping.omniId;
    
    updates.push({
      valueId: placeholder.value_id,
      postId: placeholder.post_id,
      oldValue: value,
      newValue: omniMediaId,
      orgSlug: placeholder.org_slug,
      wpMediaId
    });
  }
  
  console.log(`   ✓ Found ${updates.length} placeholders with valid mappings`);
  console.log(`   ⚠ ${notFound.length} placeholders without mappings`);
  
  if (notFound.length > 0) {
    console.log('\n   Sample unmapped placeholders:');
    const samples = notFound.slice(0, 10);
    for (const sample of samples) {
      console.log(`     - ${sample.org_slug}: ${sample.value} (${sample.reason})`);
    }
    console.log('');
  }
  
  // Get unique media IDs to verify
  const uniqueMediaIds = [...new Set(updates.map(u => u.newValue))];
  console.log(`   Verifying ${uniqueMediaIds.length} unique media IDs exist in database...`);
  const existingMediaIds = await verifyMediaIdsExist(uniqueMediaIds);
  console.log(`   ✓ ${existingMediaIds.size} media IDs verified in database`);
  
  // Filter out updates where media doesn't exist
  const validUpdates = updates.filter(u => existingMediaIds.has(u.newValue));
  const missingMedia = updates.filter(u => !existingMediaIds.has(u.newValue));
  
  if (missingMedia.length > 0) {
    console.log(`   ⚠ ${missingMedia.length} placeholders point to media IDs not in database`);
  }
  
  if (validUpdates.length === 0) {
    console.log('\n   ⚠ No valid updates to generate');
    return '-- No valid updates found';
  }
  
  // Group updates by media ID for better SQL organization
  const updatesByMediaId = new Map();
  for (const update of validUpdates) {
    if (!updatesByMediaId.has(update.newValue)) {
      updatesByMediaId.set(update.newValue, []);
    }
    updatesByMediaId.get(update.newValue).push(update);
  }
  
  // Generate UPDATE statements
  for (const [omniMediaId, updateList] of updatesByMediaId.entries()) {
    const valueIds = updateList.map(u => u.valueId);
    
    sqlStatements.push(`-- Update ${updateList.length} placeholders to media ID: ${omniMediaId}`);
    sqlStatements.push(`UPDATE post_field_values`);
    sqlStatements.push(`SET value = '${omniMediaId}'`);
    sqlStatements.push(`WHERE id IN (${valueIds.map(id => `'${id}'`).join(',')});`);
    sqlStatements.push('');
  }
  
  sqlStatements.push(`-- Total updates: ${validUpdates.length} placeholders mapped to ${updatesByMediaId.size} media IDs`);
  
  return sqlStatements.join('\n');
}

async function main() {
  try {
    console.log('============================================================');
    console.log('Update wp-media Placeholders to Actual Media IDs');
    console.log('============================================================');
    console.log('');
    
    // Load all media mappings
    const mediaMappings = await loadAllMediaMappings();
    console.log(`   ✓ Total unique media mappings: ${mediaMappings.size}\n`);
    
    // Get all wp-media placeholders from database
    const placeholders = await getWpMediaPlaceholders();
    console.log(`   ✓ Found ${placeholders.length} wp-media placeholders in database\n`);
    
    // Generate SQL
    console.log('Generating update SQL...');
    const sql = await generateUpdateSQL(placeholders, mediaMappings);
    await fs.writeFile(OUTPUT_SQL, sql, 'utf-8');
    
    console.log(`   ✓ Generated: ${OUTPUT_SQL}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Review ${OUTPUT_SQL}`);
    console.log(`2. Run: cd "${PROJECT_ROOT}" && npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/update-wp-media-placeholders.sql --yes`);
    console.log('3. Verify media is linked: SELECT pfv.value, m.filename FROM post_field_values pfv JOIN media m ON pfv.value = m.id LIMIT 5;');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
