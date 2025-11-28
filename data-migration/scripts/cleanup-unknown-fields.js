/**
 * Generate SQL to Cleanup Unknown Fields
 * 
 * After mapping unknown fields to correct fields, generates DELETE statements
 * to remove unused "unknown-field-*" custom fields from the database.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, 'post_field_values_more_recent.csv');

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
  console.log('Generate SQL: Cleanup Unknown Fields');
  console.log('============================================================');
  console.log('');

  // Load custom fields to find unknown fields
  console.log('Loading custom fields...');
  const customFieldsContent = await fs.readFile(CUSTOM_FIELDS_CSV, 'utf-8');
  const customFieldsLines = customFieldsContent.split('\n').filter(line => line.trim());
  
  const unknownFieldIds = new Set();
  for (let i = 1; i < customFieldsLines.length; i++) {
    const parts = parseCSVLine(customFieldsLines[i]);
    const id = parts[0]?.trim();
    const name = parts[2]?.trim();
    const slug = parts[3]?.trim();
    
    if (name === 'Unknown Field' || slug?.startsWith('unknown-field-')) {
      unknownFieldIds.add(id);
    }
  }
  
  console.log(`   ✓ Found ${unknownFieldIds.size} unknown field entries\n`);

  // Load post_field_values to see which unknown fields are still in use
  console.log('Loading post_field_values...');
  const valuesContent = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
  const valuesLines = valuesContent.split('\n').filter(line => line.trim());
  const valuesHeader = valuesLines[0]?.split(',');
  const fieldIdIndex = valuesHeader?.indexOf('custom_field_id');
  
  const usedUnknownFieldIds = new Set();
  for (let i = 1; i < valuesLines.length; i++) {
    const parts = parseCSVLine(valuesLines[i]);
    const fieldId = parts[fieldIdIndex]?.trim();
    if (fieldId && unknownFieldIds.has(fieldId)) {
      usedUnknownFieldIds.add(fieldId);
    }
  }
  
  console.log(`   ✓ Found ${usedUnknownFieldIds.size} unknown fields still in use\n`);

  // Fields that can be safely deleted (not in use)
  const unusedUnknownFieldIds = Array.from(unknownFieldIds).filter(id => !usedUnknownFieldIds.has(id));
  
  console.log(`   ✓ Found ${unusedUnknownFieldIds.length} unknown fields that can be deleted\n`);

  if (unusedUnknownFieldIds.length === 0) {
    console.log('No unknown fields to delete (all are still in use).');
    console.log('Run the mapping SQL first to update post_field_values.');
    return;
  }

  // Generate SQL
  const sqlStatements = [];
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Cleanup Unknown Fields');
  sqlStatements.push(`-- Total unknown fields to delete: ${unusedUnknownFieldIds.length}`);
  sqlStatements.push(`-- Unknown fields still in use: ${usedUnknownFieldIds.size}`);
  sqlStatements.push('-- WARNING: Only run this AFTER running the mapping SQL to update post_field_values');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Note: D1 executes each statement atomically, no transaction needed');
  sqlStatements.push('');

  // Delete in batches
  const batchSize = 100;
  for (let i = 0; i < unusedUnknownFieldIds.length; i += batchSize) {
    const batch = unusedUnknownFieldIds.slice(i, i + batchSize);
    const idsList = batch.map(id => `'${id}'`).join(',');
    sqlStatements.push(`-- Batch ${Math.floor(i / batchSize) + 1}: Deleting ${batch.length} unknown fields`);
    sqlStatements.push(`DELETE FROM custom_fields WHERE id IN (${idsList});`);
    sqlStatements.push('');
  }

  // D1 executes each statement atomically, no COMMIT needed
  sqlStatements.push('');

  // Save SQL file
  const sqlPath = path.join(__dirname, 'cleanup-unknown-fields.sql');
  await fs.writeFile(sqlPath, sqlStatements.join('\n'));
  
  console.log(`✓ SQL file generated: ${sqlPath}`);
  console.log(`  Fields to delete: ${unusedUnknownFieldIds.length}`);
  console.log(`  Fields still in use: ${usedUnknownFieldIds.size}`);
  console.log('');
  console.log('⚠ IMPORTANT: Only run this SQL AFTER running map-unknown-fields-via-values.sql');
  console.log('   to update post_field_values.custom_field_id first!');
  console.log('');
}

main().catch(console.error);

