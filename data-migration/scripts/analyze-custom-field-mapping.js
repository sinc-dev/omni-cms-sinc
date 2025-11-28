/**
 * Analyze custom field mapping issue
 * 
 * Problem:
 * - We created ~66,188 "Unknown Field" custom fields
 * - post_field_values uses old WordPress custom field IDs that map to these "unknown-field" entries
 * - We need to map old WordPress IDs to proper custom field IDs from custom_fields.csv
 * 
 * This script:
 * 1. Analyzes the mapping between old WordPress IDs and proper custom fields
 * 2. Generates a report on what needs to be fixed
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CORRECT_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields.csv');
const ALL_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, '5-15-pm-28-11-2025-post_field_values.csv');

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
    console.log('Analyze Custom Field Mapping Issue');
    console.log('============================================================\n');
    
    // Load correct custom fields
    console.log('Loading correct custom fields...');
    const correctFieldsContent = await fs.readFile(CORRECT_FIELDS_CSV, 'utf-8');
    const correctFieldsLines = correctFieldsContent.split('\n').filter(line => line.trim());
    const correctFieldsHeader = correctFieldsLines[0]?.split(',');
    
    const correctFields = new Map(); // slug -> { id, name, orgId }
    const correctFieldsById = new Map(); // id -> { slug, name, orgId }
    
    for (let i = 1; i < correctFieldsLines.length; i++) {
      const parts = parseCSVLine(correctFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (id && slug) {
        correctFields.set(slug, { id, name, orgId });
        correctFieldsById.set(id, { slug, name, orgId });
      }
    }
    
    console.log(`   ✓ Loaded ${correctFields.size} correct custom fields`);
    
    // Load all custom fields (including unknown ones)
    console.log('\nLoading all custom fields...');
    const allFieldsContent = await fs.readFile(ALL_FIELDS_CSV, 'utf-8');
    const allFieldsLines = allFieldsContent.split('\n').filter(line => line.trim());
    const allFieldsHeader = allFieldsLines[0]?.split(',');
    
    const unknownFields = new Map(); // id -> { orgId, slug }
    const unknownFieldsByOrg = new Map(); // orgId -> count
    
    for (let i = 1; i < allFieldsLines.length; i++) {
      const parts = parseCSVLine(allFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (name === 'Unknown Field' || slug?.startsWith('unknown-field-')) {
        unknownFields.set(id, { orgId, slug });
        const count = unknownFieldsByOrg.get(orgId) || 0;
        unknownFieldsByOrg.set(orgId, count + 1);
      }
    }
    
    console.log(`   ✓ Found ${unknownFields.size} "Unknown Field" entries`);
    console.log(`   Breakdown by organization:`);
    for (const [orgId, count] of unknownFieldsByOrg.entries()) {
      console.log(`     ${orgId}: ${count} unknown fields`);
    }
    
    // Analyze post_field_values usage
    console.log('\nAnalyzing post_field_values usage...');
    const postValuesContent = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
    const postValuesLines = postValuesContent.split('\n').filter(line => line.trim());
    const postValuesHeader = postValuesLines[0]?.split(',');
    const fieldIdIndex = postValuesHeader?.indexOf('custom_field_id');
    
    const fieldUsage = new Map(); // custom_field_id -> count
    const unknownFieldUsage = new Map(); // unknown_field_id -> count
    
    for (let i = 1; i < postValuesLines.length; i++) {
      const parts = parseCSVLine(postValuesLines[i]);
      const fieldId = parts[fieldIdIndex]?.trim();
      
      if (fieldId) {
        const count = fieldUsage.get(fieldId) || 0;
        fieldUsage.set(fieldId, count + 1);
        
        if (unknownFields.has(fieldId)) {
          const count2 = unknownFieldUsage.get(fieldId) || 0;
          unknownFieldUsage.set(fieldId, count2 + 1);
        }
      }
    }
    
    console.log(`   ✓ Analyzed ${fieldUsage.size} unique custom field IDs in use`);
    console.log(`   ✓ ${unknownFieldUsage.size} are "Unknown Field" IDs`);
    
    // Count total values using unknown fields
    let totalUnknownValues = 0;
    for (const count of unknownFieldUsage.values()) {
      totalUnknownValues += count;
    }
    console.log(`   ✓ ${totalUnknownValues} post_field_values use "Unknown Field" custom fields`);
    
    // Generate report
    console.log('\n============================================================');
    console.log('RECOMMENDATION');
    console.log('============================================================');
    console.log('\nThe issue:');
    console.log(`  - ${unknownFields.size} "Unknown Field" custom fields were created`);
    console.log(`  - ${totalUnknownValues} post_field_values reference these unknown fields`);
    console.log(`  - We need to map old WordPress custom field IDs to proper custom field IDs`);
    console.log('\nSolution approach:');
    console.log('  1. Check WordPress raw data to find original custom field names/keys');
    console.log('  2. Map old WordPress custom field IDs to proper custom fields by:');
    console.log('     - Matching by organization + field name/slug');
    console.log('     - Or using import mappings if available');
    console.log('  3. Update post_field_values.custom_field_id to use correct IDs');
    console.log('  4. Delete the "Unknown Field" custom fields');
    console.log('  5. Update post_type_fields to reference correct custom field IDs');
    console.log('\nNext steps:');
    console.log('  - Check WordPress raw data for custom field metadata');
    console.log('  - Create mapping script to update post_field_values');
    console.log('  - Generate SQL to clean up unknown fields');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

