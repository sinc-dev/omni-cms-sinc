/**
 * Regenerate Unknown Fields Mapping SQL from CSV Exports
 * 
 * This script reads CSV files exported from D1 database and generates SQL
 * to map unknown fields to correct custom fields based on value patterns.
 * 
 * Strategy:
 * 1. Read unknown fields from CSV (exported from D1)
 * 2. Read valid custom fields from CSV (exported from D1)
 * 3. Match unknown fields to correct fields based on:
 *    - Value patterns (currency, degree levels, languages, durations, prices, etc.)
 *    - Post type context
 *    - Organization context
 * 4. Generate SQL to update post_field_values.custom_field_id
 * 
 * To use:
 * 1. Run export-unknown-fields.sql in D1, save as unknown-fields-export.csv
 * 2. Run export-valid-custom-fields.sql in D1, save as valid-custom-fields-export.csv
 * 3. Place both CSV files in the scripts directory
 * 4. Run this script: node regenerate-unknown-fields-mapping.js
 */

import fs from 'fs/promises';
import { existsSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple locations for CSV files
const CSV_DIRS = [
  path.join(__dirname, 'db-11-23-pm-28-11-2025'), // User's export directory
  __dirname // Scripts directory
];

const UNKNOWN_FIELDS_CSV = findCSVFile('unknown-fields-export.csv');
const VALID_FIELDS_CSV = findCSVFile('valid-custom-fields-export.csv');
const OUTPUT_SQL = path.join(__dirname, 'map-unknown-fields-regenerated.sql');

/**
 * Find CSV file in multiple possible locations
 */
function findCSVFile(filename) {
  for (const dir of CSV_DIRS) {
    const filePath = path.join(dir, filename);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  // Return default location (will show error if not found)
  return path.join(__dirname, filename);
}

/**
 * Parse CSV line (handles quoted values and escaped quotes)
 */
function parseCSVLine(line) {
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote (""), add single quote and skip next char
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
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

/**
 * Read CSV file and return array of objects
 */
async function readCSV(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== header.length) {
      continue; // Skip malformed rows
    }
    
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j].trim()] = values[j]?.trim() || '';
    }
    data.push(row);
  }
  
  return data;
}

/**
 * Get all unknown fields with their values and context from CSV
 */
async function getUnknownFields() {
  console.log('Reading unknown fields from CSV...');
  
  try {
    const data = await readCSV(UNKNOWN_FIELDS_CSV);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`CSV file not found: ${UNKNOWN_FIELDS_CSV}\nPlease run export-unknown-fields.sql in D1 and save the output as unknown-fields-export.csv`);
    }
    throw error;
  }
}

/**
 * Get all valid custom fields by organization and post type from CSV
 */
async function getValidCustomFields() {
  console.log('Reading valid custom fields from CSV...');
  
  try {
    const data = await readCSV(VALID_FIELDS_CSV);
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`CSV file not found: ${VALID_FIELDS_CSV}\nPlease run export-valid-custom-fields.sql in D1 and save the output as valid-custom-fields-export.csv`);
    }
    throw error;
  }
}

/**
 * Get all custom fields from database (including those not in CSV)
 * This helps find fields like 'disciplines' that exist but may not be currently used
 */
async function getAllCustomFieldsFromDB() {
  console.log('Querying database for all custom fields...');
  
  // Export SQL to get all custom fields with their org and post type context
  const exportSql = `
    SELECT 
      cf.id,
      cf.name,
      cf.slug,
      cf.organization_id,
      o.slug as org_slug,
      pt.slug as post_type_slug
    FROM custom_fields cf
    INNER JOIN organizations o ON cf.organization_id = o.id
    LEFT JOIN post_type_fields ptf ON cf.id = ptf.custom_field_id
    LEFT JOIN post_types pt ON ptf.post_type_id = pt.id
    WHERE cf.name != 'Unknown Field' AND cf.slug NOT LIKE 'unknown-field-%'
    GROUP BY cf.id, cf.name, cf.slug, cf.organization_id, o.slug, pt.slug
  `;
  
  // Write to temp file and execute
  const tempFile = path.join(__dirname, 'temp-all-fields.sql');
  writeFileSync(tempFile, exportSql, 'utf-8');
  
  try {
    const { execSync } = await import('child_process');
    const PROJECT_ROOT = path.join(__dirname, '..', '..');
    const command = `cd "${PROJECT_ROOT}" && npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/temp-all-fields.sql --json`;
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
    
    // Parse JSON
    const lines = output.trim().split('\n');
    let jsonStr = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        jsonStr = trimmed;
        break;
      }
    }
    
    if (!jsonStr) {
      console.warn('   ⚠ Could not parse database response, using CSV only');
      return [];
    }
    
    const result = JSON.parse(jsonStr);
    const fields = Array.isArray(result) && result[0]?.results ? result[0].results : [];
    
    // Clean up
    try {
      unlinkSync(tempFile);
    } catch (e) {}
    
    return fields;
  } catch (error) {
    console.warn('   ⚠ Could not query database for all fields, using CSV only:', error.message);
    try {
      unlinkSync(tempFile);
    } catch (e) {}
    return [];
  }
}

/**
 * Match unknown field value to correct field based on patterns
 */
function matchFieldByValue(value, validFields, orgSlug, postTypeSlug) {
  if (!value || typeof value !== 'string') return null;
  
  const normalizedValue = value.trim();
  
  // Filter valid fields for this org and post type (also include 'any' post type fields)
  const relevantFields = validFields.filter(f => 
    f.org_slug === orgSlug && (f.post_type_slug === postTypeSlug || f.post_type_slug === 'any')
  );
  
  // Currency patterns
  if (/^(USD|EUR|GBP|KZT|TRY|RUB)$/i.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'tuition_currency' || 
      f.name.toLowerCase().includes('currency')
    );
    if (field) return field;
  }
  
  // Degree level patterns
  if (/^(Undergraduate|Postgraduate|PhD|Bachelor|Master|Doctorate|Graduate)$/i.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'degree_level' || 
      f.name.toLowerCase().includes('degree level')
    );
    if (field) return field;
  }
  
  // Language patterns
  if (/^(English|Kazakh|Russian|Turkish|French|Spanish|German|Italian)$/i.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'language' || 
      f.name.toLowerCase().includes('language')
    );
    if (field) return field;
  }
  
  // Duration patterns (numbers or ranges, including decimals and text descriptions)
  if (/^(\d+\.?\d*|\d+\.?\d*\s*-\s*\d+\.?\d*)$/.test(normalizedValue) || 
      /^\d+\.?\d*\s*\(.*year|years|month|months/i.test(normalizedValue) ||
      (/year|years|month|months/i.test(normalizedValue) && /^\d+\.?\d*/.test(normalizedValue))) {
    const field = relevantFields.find(f => 
      f.slug === 'duration_in_years' || 
      f.name.toLowerCase().includes('duration')
    );
    if (field) return field;
  }
  
  // Price patterns (numbers with optional decimals)
  if (/^\d+\.?\d*$/.test(normalizedValue) && parseFloat(normalizedValue) > 100) {
    const field = relevantFields.find(f => 
      f.slug === 'yearly_tuition_fee' || 
      f.slug === 'tuition_fee' ||
      f.name.toLowerCase().includes('tuition') ||
      f.name.toLowerCase().includes('fee')
    );
    if (field) return field;
  }
  
  // Media placeholder patterns
  if (normalizedValue.startsWith('wp-media-')) {
    // For universities, likely logo or background image
    if (postTypeSlug === 'universities') {
      const field = relevantFields.find(f => 
        f.slug === 'logo' || 
        f.slug === 'university_background_image' ||
        f.name.toLowerCase().includes('logo') ||
        f.name.toLowerCase().includes('image')
      );
      if (field) return field;
    }
    // For programs, could be featured image
    if (postTypeSlug === 'programs') {
      // Check for 'featured' field (Paris American uses this)
      const field = relevantFields.find(f => 
        f.slug === 'featured' ||
        f.slug === 'featured_image' || 
        f.slug === 'program_image' ||
        f.name.toLowerCase().includes('featured') ||
        f.name.toLowerCase().includes('image')
      );
      if (field) return field;
    }
  }
  
  // University name patterns (long text, likely contains "University" or "College")
  if (normalizedValue.length > 20 && /university|college|institute|academy/i.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'associated_university_name' || 
      f.name.toLowerCase().includes('university name')
    );
    if (field) return field;
  }
  
  // HubSpot ID patterns (long numeric strings)
  if (/^\d{10,}$/.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'associated_university_hubspot_id' || 
      f.name.toLowerCase().includes('hubspot')
    );
    if (field) return field;
  }
  
  // Disciplines/subjects (broader matching)
  const commonDisciplines = [
    'Social Sciences', 'Law', 'Nursing', 'Psychology', 'Engineering', 
    'Medicine', 'Business', 'Economics', 'International Relations', 
    'Education', 'Arts', 'Science', 'Technology', 'Pharmacy',
    'Physics', 'Chemistry', 'Mathematics', 'Accounting', 'Finance',
    'Management', 'Administration', 'Design', 'Foundation', 'Programme'
  ];
  
  // Check if value looks like a discipline/subject
  const looksLikeDiscipline = commonDisciplines.some(d => 
    normalizedValue.toLowerCase().includes(d.toLowerCase())
  ) || (
    // Single word or short phrase that's not a number, date, or common field value
    normalizedValue.length > 3 && 
    normalizedValue.length < 50 &&
    !/^\d+\.?\d*$/.test(normalizedValue) && // Not a number
    !/ago|month|year|day/i.test(normalizedValue) && // Not a date
    !/^(USD|EUR|GBP|KZT|TRY|RUB|English|Kazakh|Russian)$/i.test(normalizedValue) && // Not currency/language
    /^[A-Za-z\s\-&]+$/.test(normalizedValue) // Only letters, spaces, hyphens, ampersands
  );
  
  if (looksLikeDiscipline) {
    const field = relevantFields.find(f => 
      f.slug === 'disciplines' || 
      f.name.toLowerCase().includes('discipline') ||
      f.name.toLowerCase().includes('subject')
    );
    if (field) return field;
  }
  
  // Entry requirements (long text, likely contains "requirements", "GPA", "IELTS", etc.)
  if (normalizedValue.length > 100 && /requirement|gpa|ielts|toefl|diploma|transcript/i.test(normalizedValue)) {
    const field = relevantFields.find(f => 
      f.slug === 'entry_requirements' || 
      f.name.toLowerCase().includes('requirement')
    );
    if (field) return field;
  }
  
  // Review content patterns
  if (postTypeSlug === 'reviews') {
    // Rating (single digit 0-5)
    if (/^[0-5]$/.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'rating' || 
        f.name.toLowerCase().includes('rating')
      );
      if (field) return field;
    }
    
    // Date patterns
    if (/ago|month|year|day/i.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'date' || 
        f.slug === 'created_at' ||
        f.name.toLowerCase().includes('date')
      );
      if (field) return field;
    }
    
    // URL patterns
    if (/^https?:\/\//.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'profile_image' || 
        f.slug === 'image_url' ||
        f.name.toLowerCase().includes('image') ||
        f.name.toLowerCase().includes('url')
      );
      if (field) return field;
    }
    
    // Review text (long content)
    if (normalizedValue.length > 50) {
      const field = relevantFields.find(f => 
        f.slug === 'content' || 
        f.slug === 'review_text' ||
        f.name.toLowerCase().includes('review') ||
        f.name.toLowerCase().includes('content')
      );
      if (field) return field;
    }
  }
  
  // Program content patterns (HTML content for Paris American)
  if (postTypeSlug === 'programs' && normalizedValue.startsWith('<')) {
    if (/curriculum|course|outline|year|semester/i.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'curriculum' || 
        f.name.toLowerCase().includes('curriculum') ||
        f.name.toLowerCase().includes('course')
      );
      if (field) return field;
    }
    
    if (/outcome|objective|able to|will be able/i.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'learning_outcomes' || 
        f.name.toLowerCase().includes('outcome') ||
        f.name.toLowerCase().includes('objective')
      );
      if (field) return field;
    }
    
    if (/career|opportunity|graduate|job/i.test(normalizedValue)) {
      const field = relevantFields.find(f => 
        f.slug === 'career_opportunities' || 
        f.name.toLowerCase().includes('career') ||
        f.name.toLowerCase().includes('opportunity')
      );
      if (field) return field;
    }
  }
  
  return null;
}

/**
 * Generate mapping SQL
 */
function generateMappingSQL(mappings) {
  const sqlStatements = [];
  
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('-- Map Unknown Fields to Proper Custom Fields (Regenerated from Current DB)');
  sqlStatements.push(`-- Total mappings: ${mappings.length}`);
  sqlStatements.push('-- Generated by analyzing value patterns and matching to correct fields');
  sqlStatements.push('-- ============================================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Note: D1 executes each statement atomically, no transaction needed');
  sqlStatements.push('');
  
  // Group mappings by correct field ID
  const mappingsByField = new Map();
  for (const mapping of mappings) {
    const key = mapping.correctFieldId;
    if (!mappingsByField.has(key)) {
      mappingsByField.set(key, {
        fieldId: key,
        fieldName: mapping.correctFieldName,
        fieldSlug: mapping.correctFieldSlug,
        unknownFieldIds: new Set()
      });
    }
    mappingsByField.get(key).unknownFieldIds.add(mapping.unknownFieldId);
  }
  
  // Generate UPDATE statements
  for (const [correctFieldId, mapping] of mappingsByField.entries()) {
    const unknownFieldIds = Array.from(mapping.unknownFieldIds);
    
    sqlStatements.push(`-- Mapping ${unknownFieldIds.length} unknown fields to: ${mapping.fieldName} (${mapping.fieldSlug})`);
    sqlStatements.push('');
    
    // Delete duplicates first (keep one per post)
    sqlStatements.push(`-- Delete duplicates first (keep one per post)`);
    sqlStatements.push(`DELETE FROM post_field_values`);
    sqlStatements.push(`WHERE custom_field_id IN (${unknownFieldIds.map(id => `'${id}'`).join(',')})`);
    sqlStatements.push(`  AND id NOT IN (`);
    sqlStatements.push(`    SELECT MIN(id) FROM post_field_values`);
    sqlStatements.push(`    WHERE custom_field_id IN (${unknownFieldIds.map(id => `'${id}'`).join(',')})`);
    sqlStatements.push(`    GROUP BY post_id`);
    sqlStatements.push(`  );`);
    sqlStatements.push('');
    
    // Update only rows that won't create duplicates
    sqlStatements.push(`-- Update only rows that won't create duplicates`);
    sqlStatements.push(`UPDATE post_field_values`);
    sqlStatements.push(`SET custom_field_id = '${correctFieldId}'`);
    sqlStatements.push(`WHERE custom_field_id IN (${unknownFieldIds.map(id => `'${id}'`).join(',')})`);
    sqlStatements.push(`  AND NOT EXISTS (`);
    sqlStatements.push(`    SELECT 1 FROM post_field_values pfv2`);
    sqlStatements.push(`    WHERE pfv2.post_id = post_field_values.post_id`);
    sqlStatements.push(`      AND pfv2.custom_field_id = '${correctFieldId}'`);
    sqlStatements.push(`      AND pfv2.id != post_field_values.id`);
    sqlStatements.push(`  );`);
    sqlStatements.push('');
    
    // Delete remaining unknown field rows that couldn't be updated
    sqlStatements.push(`-- Delete remaining unknown field rows that couldn't be updated`);
    sqlStatements.push(`DELETE FROM post_field_values`);
    sqlStatements.push(`WHERE custom_field_id IN (${unknownFieldIds.map(id => `'${id}'`).join(',')});`);
    sqlStatements.push('');
  }
  
  return sqlStatements.join('\n');
}

async function main() {
  try {
    console.log('============================================================');
    console.log('Regenerate Unknown Fields Mapping SQL');
    console.log('============================================================');
    console.log('');
    
    // Get data from database
    const unknownFields = await getUnknownFields();
    console.log(`   ✓ Found ${unknownFields.length} unknown field values\n`);
    
    const validFieldsFromCSV = await getValidCustomFields();
    console.log(`   ✓ Found ${validFieldsFromCSV.length} valid custom field entries from CSV\n`);
    
    // Also get all fields from database (includes fields not in CSV)
    const allFieldsFromDB = await getAllCustomFieldsFromDB();
    console.log(`   ✓ Found ${allFieldsFromDB.length} custom fields from database\n`);
    
    // Merge fields, prioritizing CSV (has usage context) but adding DB fields
    const validFieldsMap = new Map();
    for (const field of validFieldsFromCSV) {
      const key = `${field.org_slug}:${field.post_type_slug}:${field.id}`;
      validFieldsMap.set(key, field);
    }
    // Add DB fields that aren't in CSV (for fields like disciplines that exist but aren't used yet)
    for (const field of allFieldsFromDB) {
      const key = `${field.org_slug}:${field.post_type_slug || 'any'}:${field.id}`;
      if (!validFieldsMap.has(key)) {
        // Add with 'any' post type so it can match
        validFieldsMap.set(key, { ...field, post_type_slug: field.post_type_slug || 'any' });
      }
    }
    
    const validFields = Array.from(validFieldsMap.values());
    console.log(`   ✓ Total unique fields available: ${validFields.length}\n`);
    
    // Create mappings
    console.log('Analyzing and matching unknown fields...');
    const mappings = [];
    const unmatched = [];
    
    for (const unknown of unknownFields) {
      const match = matchFieldByValue(
        unknown.value,
        validFields,
        unknown.org_slug,
        unknown.post_type_slug
      );
      
      if (match) {
        mappings.push({
          valueId: unknown.value_id,
          postId: unknown.post_id,
          unknownFieldId: unknown.unknown_field_id,
          unknownFieldSlug: unknown.unknown_field_slug,
          value: unknown.value,
          correctFieldId: match.id,
          correctFieldName: match.name,
          correctFieldSlug: match.slug,
          orgSlug: unknown.org_slug,
          postTypeSlug: unknown.post_type_slug
        });
      } else {
        unmatched.push(unknown);
      }
    }
    
    console.log(`   ✓ Matched ${mappings.length} unknown fields`);
    console.log(`   ⚠ Unmatched: ${unmatched.length} unknown fields\n`);
    
    if (unmatched.length > 0) {
      console.log('Sample unmatched values:');
      const samples = unmatched.slice(0, 10);
      for (const sample of samples) {
        const value = sample.value || '(null)';
        const valuePreview = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : String(value);
        console.log(`   - ${sample.org_slug || 'unknown'}/${sample.post_type_slug || 'unknown'}: ${valuePreview}`);
      }
      console.log('');
    }
    
    // Generate SQL
    console.log('Generating SQL...');
    const sql = generateMappingSQL(mappings);
    await fs.writeFile(OUTPUT_SQL, sql, 'utf-8');
    
    console.log(`   ✓ Generated: ${OUTPUT_SQL}`);
    console.log(`   Total mappings: ${mappings.length}`);
    console.log(`   Unique unknown fields mapped: ${new Set(mappings.map(m => m.unknownFieldId)).size}`);
    console.log(`   Unique correct fields: ${new Set(mappings.map(m => m.correctFieldId)).size}`);
    console.log('');
    console.log('Next steps:');
    console.log(`1. Review ${OUTPUT_SQL}`);
    console.log(`2. Run: cd "${path.join(__dirname, '..', '..')}" && npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/map-unknown-fields-regenerated.sql --yes`);
    console.log('3. Verify results with check-remaining-unknown-fields.sql');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

