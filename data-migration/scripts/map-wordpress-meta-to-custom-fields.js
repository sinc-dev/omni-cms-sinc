/**
 * Map WordPress Meta Fields to Proper Custom Fields
 * 
 * Strategy:
 * 1. Extract meta keys from WordPress raw.json files
 * 2. Map meta keys to proper custom field IDs by matching slugs
 * 3. Create mapping from unknown field IDs (used in post_field_values) to proper field IDs
 * 4. Generate SQL to update post_field_values.custom_field_id
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
const POSTS_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-posts.csv');
const POST_TYPES_CSV = path.join(CSV_DIR, '5-19-pm-28-11-2025-post_types.csv');

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
 * Extract all meta keys from WordPress raw.json files
 */
async function extractWordPressMetaKeys() {
  const orgsDir = path.join(__dirname, '..', 'organizations');
  const organizations = ['study-in-north-cyprus', 'study-in-kazakhstan', 'paris-american-international-university'];
  
  const metaKeysByOrg = new Map(); // orgSlug -> Set of meta keys
  
  for (const orgSlug of organizations) {
    const orgDir = path.join(orgsDir, orgSlug);
    const rawDataDir = path.join(orgDir, 'raw-data');
    const metaKeys = new Set();
    
    try {
      const entries = await fs.readdir(rawDataDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const rawJsonPath = path.join(rawDataDir, entry.name, 'raw.json');
          try {
            const content = await fs.readFile(rawJsonPath, 'utf-8');
            const posts = JSON.parse(content);
            
            // Extract meta keys from first few posts
            for (let i = 0; i < Math.min(100, posts.length); i++) {
              const post = posts[i];
              if (post.meta && typeof post.meta === 'object') {
                for (const key of Object.keys(post.meta)) {
                  // Skip WordPress internal meta keys
                  if (!key.startsWith('_') && !key.startsWith('hs_') && key !== 'footnotes' && key !== 'content-type') {
                    metaKeys.add(key);
                  }
                }
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
    
    metaKeysByOrg.set(orgSlug, metaKeys);
    console.log(`   ✓ ${orgSlug}: Found ${metaKeys.size} unique meta keys`);
  }
  
  return metaKeysByOrg;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('============================================================');
    console.log('Map WordPress Meta Fields to Proper Custom Fields');
    console.log('============================================================\n');
    
    // Organization directory path (used throughout)
    const orgsDir = path.join(__dirname, '..', 'organizations');
    
    // Load correct custom fields
    console.log('Loading correct custom fields...');
    const correctFieldsContent = await fs.readFile(CORRECT_FIELDS_CSV, 'utf-8');
    const correctFieldsLines = correctFieldsContent.split('\n').filter(line => line.trim());
    
    const correctFields = new Map(); // id -> { orgId, name, slug }
    const correctFieldsByOrgAndSlug = new Map(); // orgId:slug -> id
    
    for (let i = 1; i < correctFieldsLines.length; i++) {
      const parts = parseCSVLine(correctFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (id && orgId && slug) {
        correctFields.set(id, { orgId, name, slug });
        const key = `${orgId}:${slug}`;
        correctFieldsByOrgAndSlug.set(key, id);
      }
    }
    
    console.log(`   ✓ Loaded ${correctFields.size} correct custom fields`);
    
    // Extract WordPress meta keys
    console.log('\nExtracting WordPress meta keys from raw.json files...');
    const metaKeysByOrg = await extractWordPressMetaKeys();
    
    // Map meta keys to custom field IDs
    console.log('\nMapping meta keys to custom field IDs...');
    const metaKeyToFieldId = new Map(); // orgId:metaKey -> fieldId
    
    // Organization ID mapping
    const orgSlugToId = {
      'study-in-north-cyprus': '3Kyv3hvrybf_YohTZRgPV',
      'study-in-kazakhstan': 'IBfLssGjH23-f9uxjH5Ms',
      'paris-american-international-university': 'ND-k8iHHx70s5XaW28Mk2'
    };
    
    for (const [orgSlug, metaKeys] of metaKeysByOrg.entries()) {
      const orgId = orgSlugToId[orgSlug];
      if (!orgId) continue;
      
      for (const metaKey of metaKeys) {
        const key = `${orgId}:${metaKey}`;
        if (correctFieldsByOrgAndSlug.has(key)) {
          const fieldId = correctFieldsByOrgAndSlug.get(key);
          metaKeyToFieldId.set(key, fieldId);
        }
      }
    }
    
    console.log(`   ✓ Mapped ${metaKeyToFieldId.size} meta keys to custom fields`);
    
    // Now we need to map unknown field IDs to proper field IDs
    // The challenge: we don't have a direct mapping from unknown field ID to meta key
    // We'll need to use the post_field_values data and match by value patterns
    
    console.log('\nAnalyzing post_field_values to create field ID mapping...');
    
    // Load posts info with slugs for matching
    const postsContent = await fs.readFile(POSTS_CSV, 'utf-8');
    const postsLines = postsContent.split('\n').filter(line => line.trim());
    const postsHeader = postsLines[0]?.split(',');
    const postIdIndex = postsHeader?.indexOf('id');
    const orgIdIndex = postsHeader?.indexOf('organization_id');
    const postTypeIdIndex = postsHeader?.indexOf('post_type_id');
    const slugIndex = postsHeader?.indexOf('slug');
    
    const postInfo = new Map(); // postId -> { orgId, postTypeId, slug }
    const postSlugToId = new Map(); // orgId:slug -> newPostId (for matching)
    
    for (let i = 1; i < postsLines.length; i++) {
      const parts = parseCSVLine(postsLines[i]);
      const postId = parts[postIdIndex]?.trim();
      const orgId = parts[orgIdIndex]?.trim();
      const postTypeId = parts[postTypeIdIndex]?.trim();
      const slug = parts[slugIndex]?.trim();
      
      if (postId && orgId && postTypeId) {
        postInfo.set(postId, { orgId, postTypeId, slug });
        if (slug) {
          postSlugToId.set(`${orgId}:${slug}`, postId);
        }
      }
    }
    
    console.log(`   ✓ Loaded ${postInfo.size} posts (${postSlugToId.size} with slugs)`);
    
    // Load WordPress raw data to get meta fields for each post
    // Each organization has its own raw-data folder with post type subdirectories
    console.log('\nLoading WordPress raw data to extract meta fields per post...');
    const wpPostMeta = new Map(); // wpPostId -> { orgId, meta }
    
    for (const orgSlug of Object.keys(orgSlugToId)) {
      const orgDir = path.join(orgsDir, orgSlug);
      const rawDataDir = path.join(orgDir, 'raw-data');
      const orgId = orgSlugToId[orgSlug];
      
      console.log(`   Loading ${orgSlug}...`);
      let orgPostCount = 0;
      
      try {
        const entries = await fs.readdir(rawDataDir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            // Each post type has its own directory (e.g., programs/, universities/, etc.)
            const rawJsonPath = path.join(rawDataDir, entry.name, 'raw.json');
            try {
              const content = await fs.readFile(rawJsonPath, 'utf-8');
              const posts = JSON.parse(content);
              
              for (const post of posts) {
                if (post.id && post.meta) {
                  const wpPostId = String(post.id);
                  wpPostMeta.set(wpPostId, { orgId, meta: post.meta });
                  orgPostCount++;
                }
              }
            } catch (error) {
              // Skip if file doesn't exist or invalid JSON
            }
          }
        }
        
        console.log(`     ✓ ${orgSlug}: ${orgPostCount} posts with meta data`);
      } catch (error) {
        console.log(`     ⚠ ${orgSlug}: ${error.message}`);
      }
    }
    
    console.log(`   ✓ Total: Loaded meta data for ${wpPostMeta.size} WordPress posts`);
    
    // Now analyze post_field_values to map unknown field IDs
    console.log('\nAnalyzing post_field_values to map unknown fields...');
    const valuesContent = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
    const valuesLines = valuesContent.split('\n').filter(line => line.trim());
    const valuesHeader = valuesLines[0]?.split(',');
    const pvPostIdIndex = valuesHeader?.indexOf('post_id');
    const pvFieldIdIndex = valuesHeader?.indexOf('custom_field_id');
    const pvValueIndex = valuesHeader?.indexOf('value');
    
    // Load unknown fields
    const allFieldsContent = await fs.readFile(ALL_FIELDS_CSV, 'utf-8');
    const allFieldsLines = allFieldsContent.split('\n').filter(line => line.trim());
    const unknownFields = new Map(); // id -> { orgId, slug }
    
    for (let i = 1; i < allFieldsLines.length; i++) {
      const parts = parseCSVLine(allFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (name === 'Unknown Field' || slug?.startsWith('unknown-field-')) {
        unknownFields.set(id, { orgId, slug });
      }
    }
    
    // Create mapping: unknownFieldId -> correctFieldId
    // Strategy: For each post_field_value with unknown field:
    // 1. Get the post -> find WordPress post ID
    // 2. Get WordPress post meta
    // 3. Match the value to a meta key
    // 4. Map meta key to correct custom field ID
    
    const fieldMapping = new Map(); // unknownFieldId -> correctFieldId
    const fieldMappingEvidence = new Map(); // unknownFieldId -> { correctFieldId, evidence }
    const unmappedFields = new Set();
    
    // Build a faster lookup: postId -> wpMeta
    // Use slug-based matching (more reliable than ID mapping)
    const postIdToWpMeta = new Map(); // newPostId -> { orgId, meta }
    
    // Match WordPress posts to new posts by slug
    for (const orgSlug of Object.keys(orgSlugToId)) {
      const orgId = orgSlugToId[orgSlug];
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
              
              for (const wpPost of posts) {
                if (wpPost.id && wpPost.meta && wpPost.slug) {
                  const wpSlug = String(wpPost.slug).trim();
                  const key = `${orgId}:${wpSlug}`;
                  const newPostId = postSlugToId.get(key);
                  
                  if (newPostId) {
                    const wpPostId = String(wpPost.id);
                    const existingMeta = wpPostMeta.get(wpPostId);
                    if (existingMeta) {
                      postIdToWpMeta.set(newPostId, existingMeta);
                    }
                  }
                }
              }
            } catch (error) {
              // Skip if file doesn't exist or invalid JSON
            }
          }
        }
      } catch (error) {
        // Skip if error
      }
    }
    
    console.log(`   ✓ Built lookup for ${postIdToWpMeta.size} posts (matched by slug)`);
    
    let processed = 0;
    let matched = 0;
    const fieldMappingCounts = new Map(); // unknownFieldId -> { correctFieldId, count }
    
    console.log(`\n   Processing ${valuesLines.length - 1} post_field_values...`);
    
    // Debug: Track sample mismatches
    let samplesChecked = 0;
    const sampleMismatches = [];
    
    for (let i = 1; i < valuesLines.length; i++) {
      const parts = parseCSVLine(valuesLines[i]);
      const postId = parts[pvPostIdIndex]?.trim();
      const fieldId = parts[pvFieldIdIndex]?.trim();
      let value = parts[pvValueIndex];
      
      // Handle CSV escaping: double quotes are escaped as ""
      // The parseCSVLine function should handle this, but we need to ensure proper unescaping
      if (value && typeof value === 'string') {
        value = value.trim();
        // If it's a quoted CSV value, remove outer quotes and unescape internal quotes
        if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
          value = value.slice(1, -1).replace(/""/g, '"');
        }
      }
      
      if (!postId || !fieldId || !unknownFields.has(fieldId)) {
        continue;
      }
      
      processed++;
      
      // Get post info
      const post = postInfo.get(postId);
      if (!post) continue;
      
      // Get WordPress meta directly
      const wpMeta = postIdToWpMeta.get(postId);
      if (!wpMeta || wpMeta.orgId !== post.orgId) {
        // Debug: collect sample mismatches
        if (samplesChecked < 10 && !wpMeta) {
          sampleMismatches.push({
            postId,
            fieldId,
            value: value.substring(0, 50),
            reason: 'No WordPress meta found for post'
          });
          samplesChecked++;
        }
        continue;
      }
      
      // Try to match value to a meta key
      // Strategy: Compare the stored value with each meta value, handling different formats
      let matchedMetaKey = null;
      const valueStr = String(value || '').trim();
      
      // Helper to normalize values for comparison
      const normalizeValue = (val) => {
        if (val === null || val === undefined) return '';
        if (Array.isArray(val)) {
          if (val.length === 0) return '';
          // For arrays, return as JSON string (don't add wp-media- prefix here)
          // The matching logic will handle wp-media- prefix stripping
          return JSON.stringify(val);
        }
        return String(val).trim();
      };
      
      // Helper to compare two values (handles numbers, strings, arrays)
      const valuesMatch = (val1, val2) => {
        // val1 is from WordPress meta (could be array, string, number)
        // val2 is the stored value (string that might be JSON)
        
        // First, try to parse val2 as JSON if it looks like JSON
        let parsedVal2 = val2;
        if (typeof val2 === 'string' && (val2.trim().startsWith('[') || val2.trim().startsWith('{'))) {
          try {
            parsedVal2 = JSON.parse(val2);
          } catch (e) {
            // Not valid JSON, use as-is
            parsedVal2 = val2;
          }
        }
        
        // Direct array comparison (most efficient)
        if (Array.isArray(val1) && Array.isArray(parsedVal2)) {
          if (val1.length !== parsedVal2.length) return false;
          for (let i = 0; i < val1.length; i++) {
            const v1 = String(val1[i]); // Meta value (e.g., "44248")
            let v2 = String(parsedVal2[i]); // Stored value (e.g., "wp-media-44248")
            
            // Strip wp-media- prefix if present
            if (v2.startsWith('wp-media-')) {
              v2 = v2.substring(9);
            }
            
            if (v2 !== v1) {
              return false;
            }
          }
          return true;
        }
        
        const norm1 = normalizeValue(val1);
        const norm2 = normalizeValue(parsedVal2);
        
        // Exact match
        if (norm1 === norm2) return true;
        
        // Remove surrounding quotes and compare
        const unquoted1 = norm1.replace(/^["']|["']$/g, '');
        const unquoted2 = norm2.replace(/^["']|["']$/g, '');
        if (unquoted1 === unquoted2) return true;
        
        // Normalize whitespace
        const spaceNorm1 = unquoted1.replace(/\s+/g, ' ').trim();
        const spaceNorm2 = unquoted2.replace(/\s+/g, ' ').trim();
        if (spaceNorm1 === spaceNorm2) return true;
        
        // Number comparison (handle "100" vs 100 vs "100.0")
        const num1 = parseFloat(spaceNorm1);
        const num2 = parseFloat(spaceNorm2);
        if (!isNaN(num1) && !isNaN(num2) && num1 === num2) return true;
        
        // Handle JSON arrays in valueStr
        // Try parsing as JSON first
        if (norm2.startsWith('[') && Array.isArray(val1)) {
          try {
            let parsed = JSON.parse(norm2);
            if (Array.isArray(parsed) && parsed.length === val1.length) {
              // Compare array elements
              // Handle wp-media- prefix: stored value might have "wp-media-44248" but meta has "44248"
              for (let i = 0; i < val1.length; i++) {
                const v1 = String(val1[i]); // Meta value (e.g., "44248")
                let v2 = String(parsed[i]); // Stored value (e.g., "wp-media-44248")
                
                // Strip wp-media- prefix if present
                if (v2.startsWith('wp-media-')) {
                  v2 = v2.substring(9); // Remove "wp-media-" prefix
                }
                
                if (v2 !== v1) {
                  return false;
                }
              }
              return true;
            }
          } catch (e) {
            // Not valid JSON, try other formats
          }
        }
        
        // Try parsing as JSON even if it doesn't start with '[' (might be in quotes)
        if (Array.isArray(val1) && (norm2.includes('wp-media-') || norm2.includes('['))) {
          try {
            // Try to find and parse JSON array in the string
            const jsonMatch = norm2.match(/\[.*?\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (Array.isArray(parsed) && parsed.length === val1.length) {
                for (let i = 0; i < val1.length; i++) {
                  const v1 = String(val1[i]);
                  let v2 = String(parsed[i]);
                  if (v2.startsWith('wp-media-')) {
                    v2 = v2.substring(9);
                  }
                  if (v2 !== v1) {
                    return false;
                  }
                }
                return true;
              }
            }
          } catch (e) {
            // Not valid JSON
          }
        }
        
        // Handle CSV-escaped JSON arrays (double quotes like ["wp-media-44248"])
        if (norm2.includes('""') && Array.isArray(val1)) {
          try {
            // Replace double quotes with single quotes for parsing
            const cleaned = norm2.replace(/""/g, '"');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length === val1.length) {
              for (let i = 0; i < val1.length; i++) {
                const v1 = String(val1[i]); // Meta value
                let v2 = String(parsed[i]); // Stored value
                
                // Strip wp-media- prefix if present
                if (v2.startsWith('wp-media-')) {
                  v2 = v2.substring(9);
                }
                
                if (v2 !== v1) {
                  return false;
                }
              }
              return true;
            }
          } catch (e) {
            // Not valid JSON
          }
        }
        
        // Handle array-like strings without brackets (e.g., "wp-media-44248,wp-media-44249")
        if (norm2.includes('wp-media-') && Array.isArray(val1)) {
          // Try to parse as comma-separated list
          const items = norm2.split(',').map(s => s.trim());
          if (items.length === val1.length) {
            let matches = true;
            for (let i = 0; i < val1.length; i++) {
              const v1 = String(val1[i]);
              let v2 = items[i];
              
              // Strip wp-media- prefix
              if (v2.startsWith('wp-media-')) {
                v2 = v2.substring(9);
              }
              
              if (v2 !== v1) {
                matches = false;
                break;
              }
            }
            if (matches) return true;
          }
        }
        
        return false;
      };
      
      // Try to find matching meta key
      for (const [metaKey, metaValue] of Object.entries(wpMeta.meta)) {
        // Skip internal keys
        if (metaKey.startsWith('_') || metaKey.startsWith('hs_') || metaKey === 'footnotes' || metaKey === 'content-type') {
          continue;
        }
        
        // Skip empty meta values
        if (metaValue === null || metaValue === undefined || metaValue === '') {
          continue;
        }
        
        // Compare values
        if (valuesMatch(metaValue, valueStr)) {
          matchedMetaKey = metaKey;
          break;
        }
      }
      
      // Debug: collect sample value mismatches (after matching attempt)
      if (samplesChecked < 5 && !matchedMetaKey) {
        // Check a few meta values to see what we're comparing against
        const sampleMetaKeys = Object.keys(wpMeta.meta)
          .filter(k => !k.startsWith('_') && !k.startsWith('hs_') && k !== 'footnotes' && k !== 'content-type')
          .slice(0, 3);
        if (sampleMetaKeys.length > 0) {
          // Find the meta key that should match (gallery for arrays)
          const galleryMeta = wpMeta.meta['gallery'];
          const galleryStr = Array.isArray(galleryMeta) ? JSON.stringify(galleryMeta) : String(galleryMeta);
          
          // Try to parse value as JSON to see what we're working with
          let parsedValue = null;
          let parseError = null;
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            parseError = e.message;
          }
          
          sampleMismatches.push({
            postId,
            fieldId,
            valueRaw: value.substring(0, 150),
            valueLength: value.length,
            valueParsed: parsedValue ? (Array.isArray(parsedValue) ? `array[${parsedValue.length}]` : typeof parsedValue) : 'parse failed',
            parseError,
            galleryMeta: galleryStr.substring(0, 150),
            galleryIsArray: Array.isArray(galleryMeta),
            sampleMetaKeys,
            sampleMetaValues: sampleMetaKeys.map(k => {
              const v = wpMeta.meta[k];
              return Array.isArray(v) ? `array[${v.length}]` : String(v).substring(0, 50);
            })
          });
          samplesChecked++;
        }
      }
      
      if (matchedMetaKey) {
        // Map meta key to correct custom field ID
        const key = `${post.orgId}:${matchedMetaKey}`;
        if (correctFieldsByOrgAndSlug.has(key)) {
          const correctFieldId = correctFieldsByOrgAndSlug.get(key);
          
          // Track mapping with count
          if (!fieldMappingCounts.has(fieldId)) {
            fieldMappingCounts.set(fieldId, new Map());
          }
          const counts = fieldMappingCounts.get(fieldId);
          const currentCount = counts.get(correctFieldId) || 0;
          counts.set(correctFieldId, currentCount + 1);
          matched++;
        }
      }
      
      processed++;
      if (processed % 5000 === 0) {
        const currentMappings = Array.from(fieldMappingCounts.entries())
          .filter(([uid, counts]) => {
            let maxCount = 0;
            for (const count of counts.values()) {
              if (count > maxCount) maxCount = count;
            }
            return maxCount >= 2; // At least 2 matches
          }).length;
        console.log(`   Processed ${processed}/${valuesLines.length - 1} values, ${currentMappings} fields mapped so far...`);
      }
    }
    
    console.log(`\n   ✓ Processed ${processed} post_field_values`);
    
    // Debug: Show sample mismatches
    if (sampleMismatches.length > 0) {
      console.log(`\n   Debug: Sample mismatches (first ${sampleMismatches.length}):`);
      for (const sample of sampleMismatches.slice(0, 5)) {
        console.log(`     Post ${sample.postId}: value="${sample.value}"`);
        if (sample.sampleMetaKeys) {
          console.log(`       Meta keys: ${sample.sampleMetaKeys.join(', ')}`);
          console.log(`       Meta values: ${sample.sampleMetaValues.join(' | ')}`);
        } else {
          console.log(`       ${sample.reason}`);
        }
      }
    }
    
    // Determine final mappings (use most common correct field for each unknown field)
    for (const [unknownFieldId, counts] of fieldMappingCounts.entries()) {
      let maxCount = 0;
      let bestFieldId = null;
      let totalCount = 0;
      
      for (const [correctFieldId, count] of counts.entries()) {
        totalCount += count;
        if (count > maxCount) {
          maxCount = count;
          bestFieldId = correctFieldId;
        }
      }
      
      if (bestFieldId && maxCount >= 2) { // Require at least 2 matches for confidence
        fieldMapping.set(unknownFieldId, bestFieldId);
        fieldMappingEvidence.set(unknownFieldId, {
          correctFieldId: bestFieldId,
          metaKey: 'matched',
          sampleValue: '',
          count: totalCount
        });
        matched++;
      }
    }
    
    console.log(`   ✓ Mapped ${fieldMapping.size} unknown fields to correct fields`);
    
    // Generate SQL to update post_field_values
    if (fieldMapping.size > 0) {
      console.log('\nGenerating SQL to update post_field_values...');
      const sqlStatements = [];
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('-- Update post_field_values: Map Unknown Fields to Proper Custom Fields');
      sqlStatements.push(`-- Total mappings: ${fieldMapping.size}`);
      sqlStatements.push('-- Generated by analyzing WordPress meta fields');
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('');
      
      // Group by correct field ID for batch updates
      const updatesByCorrectField = new Map(); // correctFieldId -> [unknownFieldIds]
      for (const [unknownId, correctId] of fieldMapping.entries()) {
        if (!updatesByCorrectField.has(correctId)) {
          updatesByCorrectField.set(correctId, []);
        }
        updatesByCorrectField.get(correctId).push(unknownId);
      }
      
      for (const [correctFieldId, unknownFieldIds] of updatesByCorrectField.entries()) {
        const field = correctFields.get(correctFieldId);
        const evidence = Array.from(fieldMappingEvidence.entries())
          .filter(([uid]) => fieldMapping.get(uid) === correctFieldId)[0]?.[1];
        
        sqlStatements.push(`-- Mapping ${unknownFieldIds.length} unknown fields to: ${field?.name || correctFieldId} (${field?.slug || 'unknown'})`);
        if (evidence) {
          sqlStatements.push(`--   Matched via meta key: ${evidence.metaKey} (${evidence.count} occurrences)`);
        }
        sqlStatements.push('');
        
        // Update in batches
        const batchSize = 50;
        for (let i = 0; i < unknownFieldIds.length; i += batchSize) {
          const batch = unknownFieldIds.slice(i, i + batchSize);
          sqlStatements.push(`UPDATE post_field_values`);
          sqlStatements.push(`SET custom_field_id = '${correctFieldId}'`);
          sqlStatements.push(`WHERE custom_field_id IN (${batch.map(id => `'${id}'`).join(', ')});`);
          sqlStatements.push('');
        }
      }
      
      const sqlPath = path.join(__dirname, 'map-unknown-fields-via-wordpress-meta.sql');
      await fs.writeFile(sqlPath, sqlStatements.join('\n'), 'utf-8');
      console.log(`   ✓ Generated SQL: ${sqlPath}`);
      
      // Save mapping report
      const mappingReport = Array.from(fieldMappingEvidence.entries()).map(([unknownId, evidence]) => ({
        unknownFieldId: unknownId,
        correctFieldId: evidence.correctFieldId,
        correctFieldName: correctFields.get(evidence.correctFieldId)?.name,
        correctFieldSlug: correctFields.get(evidence.correctFieldId)?.slug,
        matchedViaMetaKey: evidence.metaKey,
        occurrences: evidence.count,
        sampleValue: evidence.sampleValue
      }));
      
      const reportPath = path.join(__dirname, 'field-mapping-report.json');
      await fs.writeFile(reportPath, JSON.stringify(mappingReport, null, 2), 'utf-8');
      console.log(`   ✓ Saved mapping report: ${reportPath}`);
    }
    
    console.log('\n============================================================');
    console.log('NEXT STEPS');
    console.log('============================================================');
    console.log('\n1. Review field-mapping-report.json');
    console.log('2. Run map-unknown-fields-via-wordpress-meta.sql');
    console.log('3. Update post_type_fields to use correct field IDs');
    console.log('4. Delete unknown field custom fields');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
