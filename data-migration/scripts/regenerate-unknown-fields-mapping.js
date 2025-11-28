/**
 * Regenerate Unknown Fields Mapping SQL from Current Database
 * 
 * This script queries the current database to get unknown fields and their values,
 * then generates SQL to map them to correct custom fields based on value patterns.
 * 
 * Strategy:
 * 1. Query database for all unknown fields with their values, post types, and organizations
 * 2. Query database for all valid custom fields by organization and post type
 * 3. Match unknown fields to correct fields based on:
 *    - Value patterns (currency, degree levels, languages, durations, prices, etc.)
 *    - Post type context
 *    - Organization context
 * 4. Generate SQL to update post_field_values.custom_field_id
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_SQL = path.join(__dirname, 'map-unknown-fields-regenerated.sql');

/**
 * Execute wrangler command and parse JSON output
 */
function executeWranglerQuery(sql) {
  try {
    // Escape SQL for command line
    const escapedSql = sql
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const command = `cd "${PROJECT_ROOT}" && npx wrangler d1 execute omni-cms --remote --command="${escapedSql}" --json`;
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 });
    
    // Parse JSON output (wrangler outputs JSON, might have other lines)
    const lines = output.trim().split('\n');
    let jsonStr = '';
    
    // Find the JSON line (starts with [ or {)
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        jsonStr = trimmed;
        break;
      }
    }
    
    if (!jsonStr) {
      console.error('Wrangler output:', output.substring(0, 500));
      throw new Error('No JSON output found in wrangler response');
    }
    
    const result = JSON.parse(jsonStr);
    if (Array.isArray(result) && result[0] && result[0].results) {
      return result[0].results;
    }
    if (result.results) {
      return result.results;
    }
    return [];
  } catch (error) {
    console.error(`Error executing query: ${error.message}`);
    if (error.stdout) console.error('Stdout:', error.stdout.toString().substring(0, 500));
    if (error.stderr) console.error('Stderr:', error.stderr.toString().substring(0, 500));
    throw error;
  }
}

/**
 * Get all unknown fields with their values and context
 */
async function getUnknownFields() {
  console.log('Querying database for unknown fields...');
  
  const sql = `
    SELECT 
      pfv.id as value_id,
      pfv.post_id,
      pfv.custom_field_id as unknown_field_id,
      pfv.value,
      p.id as post_id,
      o.slug as org_slug,
      o.id as org_id,
      pt.slug as post_type_slug,
      pt.id as post_type_id,
      cf.slug as unknown_field_slug
    FROM post_field_values pfv
    INNER JOIN custom_fields cf ON pfv.custom_field_id = cf.id
    INNER JOIN posts p ON pfv.post_id = p.id
    INNER JOIN organizations o ON p.organization_id = o.id
    INNER JOIN post_types pt ON p.post_type_id = pt.id
    WHERE cf.name = 'Unknown Field' OR cf.slug LIKE 'unknown-field-%'
    ORDER BY o.slug, pt.slug, p.id
  `;
  
  return executeWranglerQuery(sql);
}

/**
 * Get all valid custom fields by organization and post type
 */
async function getValidCustomFields() {
  console.log('Querying database for valid custom fields...');
  
  const sql = `
    SELECT 
      cf.id,
      cf.name,
      cf.slug,
      cf.organization_id,
      o.slug as org_slug,
      pt.slug as post_type_slug,
      COUNT(pfv.id) as usage_count
    FROM custom_fields cf
    INNER JOIN post_field_values pfv ON cf.id = pfv.custom_field_id
    INNER JOIN posts p ON pfv.post_id = p.id
    INNER JOIN organizations o ON p.organization_id = o.id
    INNER JOIN post_types pt ON p.post_type_id = pt.id
    WHERE cf.name != 'Unknown Field' AND cf.slug NOT LIKE 'unknown-field-%'
    GROUP BY cf.id, cf.name, cf.slug, cf.organization_id, o.slug, pt.slug
    ORDER BY o.slug, pt.slug, usage_count DESC
  `;
  
  return executeWranglerQuery(sql);
}

/**
 * Match unknown field value to correct field based on patterns
 */
function matchFieldByValue(value, validFields, orgSlug, postTypeSlug) {
  if (!value || typeof value !== 'string') return null;
  
  const normalizedValue = value.trim();
  
  // Filter valid fields for this org and post type
  const relevantFields = validFields.filter(f => 
    f.org_slug === orgSlug && f.post_type_slug === postTypeSlug
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
  
  // Duration patterns (numbers or ranges)
  if (/^(\d+|\d+\s*-\s*\d+)$/.test(normalizedValue)) {
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
      const field = relevantFields.find(f => 
        f.slug === 'featured_image' || 
        f.slug === 'program_image' ||
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
  
  // Disciplines/subjects (common academic fields)
  const commonDisciplines = [
    'Social Sciences', 'Law', 'Nursing', 'Psychology', 'Engineering', 
    'Medicine', 'Business', 'Economics', 'International Relations', 
    'Education', 'Arts', 'Science', 'Technology', 'Pharmacy'
  ];
  if (commonDisciplines.some(d => normalizedValue.includes(d))) {
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
    
    const validFields = await getValidCustomFields();
    console.log(`   ✓ Found ${validFields.length} valid custom field entries\n`);
    
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
        const valuePreview = sample.value.length > 100 
          ? sample.value.substring(0, 100) + '...' 
          : sample.value;
        console.log(`   - ${sample.org_slug}/${sample.post_type_slug}: ${valuePreview}`);
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
    console.log('2. Run: cd "' + PROJECT_ROOT + '" && npx wrangler d1 execute omni-cms --remote --file=data-migration/scripts/map-unknown-fields-regenerated.sql --yes');
    console.log('3. Verify results with check-remaining-unknown-fields.sql');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
