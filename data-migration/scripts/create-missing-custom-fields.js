/**
 * Generate SQL to Create Missing Custom Fields
 * 
 * Based on trace-wordpress-meta-keys-report.json, generates INSERT statements
 * for custom fields that don't exist in the database but are needed based on
 * WordPress meta keys found in raw.json files.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_PATH = path.join(__dirname, 'trace-wordpress-meta-keys-report.json');
const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');

const orgSlugToId = {
  'study-in-north-cyprus': '3Kyv3hvrybf_YohTZRgPV',
  'study-in-kazakhstan': 'IBfLssGjH23-f9uxjH5Ms',
  'paris-american-international-university': 'ND-k8iHHx70s5XaW28Mk2'
};

/**
 * Generate a UUID-like ID
 */
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Convert meta key to field name (title case)
 */
function metaKeyToName(metaKey) {
  return metaKey
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert meta key to slug (underscores)
 */
function metaKeyToSlug(metaKey) {
  return metaKey.replace(/-/g, '_');
}

/**
 * Normalize a string
 */
function normalize(str) {
  return str.replace(/[-_]/g, '').toLowerCase();
}

/**
 * Parse CSV line
 */
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

async function main() {
  process.stdout.write('Starting...\n');
  console.log('============================================================');
  console.log('Generate SQL: Create Missing Custom Fields');
  console.log('============================================================');
  console.log('');

  // Load existing custom fields to check what already exists
  console.log('Loading existing custom fields...');
  const existingFieldsContent = await fs.readFile(CUSTOM_FIELDS_CSV, 'utf-8');
  const existingFieldsLines = existingFieldsContent.split('\n').filter(line => line.trim());
  
  const existingFields = new Map(); // orgId:normalizedSlug -> true
  for (let i = 1; i < existingFieldsLines.length; i++) {
    const parts = parseCSVLine(existingFieldsLines[i]);
    const orgId = parts[1]?.trim();
    const slug = parts[3]?.trim();
    if (orgId && slug) {
      const normalizedSlug = normalize(slug);
      existingFields.set(`${orgId}:${normalizedSlug}`, true);
    }
  }
  
  console.log(`   ✓ Loaded ${existingFields.size} existing custom fields\n`);

  // Load trace report
  console.log('Loading trace report...');
  const reportContent = await fs.readFile(REPORT_PATH, 'utf-8');
  const report = JSON.parse(reportContent);
  
  console.log(`   ✓ Loaded report for ${Object.keys(report.organizations).length} organizations\n`);

  // Collect missing fields
  // Only include fields that don't have matchingField (completely missing)
  const missingFields = []; // Array of { orgId, orgSlug, postType, metaKey, slug, name }
  const seenFields = new Set(); // Track to avoid duplicates

  for (const [orgSlug, orgData] of Object.entries(report.organizations)) {
    const orgId = orgData.orgId;
    
    for (const [postTypeSlug, postTypeData] of Object.entries(orgData.postTypes)) {
      for (const analysis of postTypeData.analysis) {
        if (!analysis.hasMatchingField) {
          const metaKey = analysis.metaKey;
          const normalizedMetaKey = analysis.normalized;
          const key = `${orgId}:${normalizedMetaKey}`;
          
          // Check if field already exists in database
          if (!existingFields.has(key)) {
            // Avoid duplicates (same meta key might appear in multiple post types)
            const uniqueKey = `${orgId}:${normalizedMetaKey}`;
            if (!seenFields.has(uniqueKey)) {
              seenFields.add(uniqueKey);
              const slug = metaKeyToSlug(metaKey);
              const name = metaKeyToName(metaKey);
              
              missingFields.push({
                orgId,
                orgSlug,
                postType: postTypeSlug,
                metaKey,
                slug,
                name
              });
            }
          }
        }
      }
    }
  }

  console.log(`Found ${missingFields.length} missing custom fields\n`);

  if (missingFields.length === 0) {
    console.log('No missing fields to create!');
    return;
  }

  // Generate SQL
  const sqlStatements = [];
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Create Missing Custom Fields');
  sqlStatements.push(`-- Total fields to create: ${missingFields.length}`);
  sqlStatements.push('-- Generated from trace-wordpress-meta-keys-report.json');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Note: D1 executes each statement atomically, no transaction needed');
  sqlStatements.push('');

  // Group by organization
  const fieldsByOrg = new Map();
  for (const field of missingFields) {
    if (!fieldsByOrg.has(field.orgId)) {
      fieldsByOrg.set(field.orgId, []);
    }
    fieldsByOrg.get(field.orgId).push(field);
  }

  const timestamp = Math.floor(Date.now() / 1000);

  for (const [orgId, fields] of fieldsByOrg.entries()) {
    const orgSlug = fields[0].orgSlug;
    sqlStatements.push(`-- Organization: ${orgSlug} (${orgId})`);
    sqlStatements.push(`-- Creating ${fields.length} custom fields`);
    sqlStatements.push('');

    for (const field of fields) {
      const id = generateId();
      sqlStatements.push(`-- ${field.name} (from meta key: "${field.metaKey}")`);
      sqlStatements.push(`INSERT OR IGNORE INTO custom_fields (id, organization_id, name, slug, field_type, settings, created_at, updated_at)`);
      sqlStatements.push(`SELECT`);
      sqlStatements.push(`  '${id}',`);
      sqlStatements.push(`  '${field.orgId}',`);
      sqlStatements.push(`  '${field.name.replace(/'/g, "''")}',`);
      sqlStatements.push(`  '${field.slug}',`);
      sqlStatements.push(`  'text',`);
      sqlStatements.push(`  NULL,`);
      sqlStatements.push(`  ${timestamp},`);
      sqlStatements.push(`  ${timestamp}`);
      sqlStatements.push(`WHERE EXISTS (SELECT 1 FROM organizations WHERE id = '${field.orgId}')`);
      sqlStatements.push(`  AND NOT EXISTS (SELECT 1 FROM custom_fields WHERE organization_id = '${field.orgId}' AND slug = '${field.slug}');`);
      sqlStatements.push('');
    }
  }

  // D1 executes each statement atomically, no COMMIT needed
  sqlStatements.push('');

  // Save SQL file
  const sqlPath = path.join(__dirname, 'create-missing-custom-fields.sql');
  await fs.writeFile(sqlPath, sqlStatements.join('\n'));
  
  console.log(`✓ SQL file generated: ${sqlPath}`);
  console.log(`  Total fields to create: ${missingFields.length}`);
  console.log('');
  
  // Summary by organization
  console.log('Summary by organization:');
  for (const [orgId, fields] of fieldsByOrg.entries()) {
    const orgSlug = fields[0].orgSlug;
    console.log(`  ${orgSlug}: ${fields.length} fields`);
  }
  console.log('');
}

main().catch(console.error);
