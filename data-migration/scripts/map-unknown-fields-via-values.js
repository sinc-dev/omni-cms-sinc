/**
 * Map Unknown Fields to Proper Custom Fields
 * 
 * Strategy:
 * 1. Load correct custom fields (first 89 from custom_fields_table_more_recent.csv)
 * 2. Load post_field_values_more_recent.csv
 * 3. For each post_field_value with unknown field:
 *    - Find WordPress post by slug
 *    - Match value to WordPress meta key
 *    - Map unknown field ID to correct custom field ID
 * 4. Generate SQL to update post_field_values.custom_field_id
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
const CORRECT_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');
const POST_FIELD_VALUES_CSV = path.join(CSV_DIR, 'post_field_values_more_recent.csv');
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
 * Compare two values (handles arrays, strings, numbers)
 */
function valuesMatch(metaValue, storedValue) {
  // Try to parse stored value as JSON
  let parsedStored = storedValue;
  if (typeof storedValue === 'string' && (storedValue.trim().startsWith('[') || storedValue.trim().startsWith('{'))) {
    try {
      parsedStored = JSON.parse(storedValue);
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Direct array comparison
  if (Array.isArray(metaValue) && Array.isArray(parsedStored)) {
    if (metaValue.length !== parsedStored.length) return false;
    for (let i = 0; i < metaValue.length; i++) {
      const metaItem = String(metaValue[i]);
      let storedItem = String(parsedStored[i]);
      
      // Strip wp-media- prefix if present
      if (storedItem.startsWith('wp-media-')) {
        storedItem = storedItem.substring(9);
      }
      
      if (storedItem !== metaItem) {
        return false;
      }
    }
    return true;
  }
  
  // String/number comparison
  const metaStr = String(metaValue || '').trim();
  const storedStr = String(parsedStored || '').trim();
  
  // Exact match
  if (metaStr === storedStr) return true;
  
  // Remove quotes and compare
  const metaUnquoted = metaStr.replace(/^["']|["']$/g, '');
  const storedUnquoted = storedStr.replace(/^["']|["']$/g, '');
  if (metaUnquoted === storedUnquoted) return true;
  
  // Normalize whitespace
  const metaNorm = metaUnquoted.replace(/\s+/g, ' ').trim();
  const storedNorm = storedUnquoted.replace(/\s+/g, ' ').trim();
  if (metaNorm === storedNorm) return true;
  
  // Number comparison
  const metaNum = parseFloat(metaNorm);
  const storedNum = parseFloat(storedNorm);
  if (!isNaN(metaNum) && !isNaN(storedNum) && metaNum === storedNum) return true;
  
  return false;
}

async function main() {
  try {
    process.stdout.write('Starting...\n');
    console.log('============================================================');
    console.log('Map Unknown Fields to Proper Custom Fields');
    console.log('============================================================');
    console.log('');
    
    const orgsDir = path.join(__dirname, '..', 'organizations');
    const orgSlugToId = {
      'study-in-north-cyprus': '3Kyv3hvrybf_YohTZRgPV',
      'study-in-kazakhstan': 'IBfLssGjH23-f9uxjH5Ms',
      'paris-american-international-university': 'ND-k8iHHx70s5XaW28Mk2'
    };
    
    // Load correct custom fields
    // Strategy: Load all fields, but also check "unknown fields" section for potential matches
    console.log('Loading correct custom fields...');
    const correctFieldsContent = await fs.readFile(CORRECT_FIELDS_CSV, 'utf-8');
    const correctFieldsLines = correctFieldsContent.split('\n').filter(line => line.trim());
    
    const correctFields = new Map(); // id -> { orgId, name, slug }
    const correctFieldsByOrgAndSlug = new Map(); // orgId:slug -> id
    const correctFieldsByOrgAndNormalized = new Map(); // orgId:normalizedSlug -> id (for matching)
    const unknownFieldsMap = new Map(); // orgId:normalizedSlug -> { id, orgId, name, slug } (from unknown section)
    
    // Normalize function
    function normalizeSlug(slug) {
      return slug.replace(/[-_]/g, '').toLowerCase();
    }
    
    // First pass: Load correct fields (before "Unknown Field" entries)
    let inUnknownSection = false;
    for (let i = 1; i < correctFieldsLines.length; i++) {
      const parts = parseCSVLine(correctFieldsLines[i]);
      const id = parts[0]?.trim();
      const orgId = parts[1]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      // Check if we've entered the unknown fields section
      if (!inUnknownSection && (name === 'Unknown Field' || slug?.startsWith('unknown-field-'))) {
        inUnknownSection = true;
      }
      
      if (id && orgId && slug) {
        const normalizedSlug = normalizeSlug(slug);
        const normalizedKey = `${orgId}:${normalizedSlug}`;
        
        if (!inUnknownSection) {
          // Correct field
          correctFields.set(id, { orgId, name, slug });
          const key = `${orgId}:${slug}`;
          correctFieldsByOrgAndSlug.set(key, id);
          correctFieldsByOrgAndNormalized.set(normalizedKey, id);
        } else {
          // Unknown field - store for potential matching
          unknownFieldsMap.set(normalizedKey, { id, orgId, name, slug });
        }
      }
    }
    
    console.log(`   ✓ Loaded ${correctFields.size} correct custom fields`);
    console.log(`   ✓ Loaded ${unknownFieldsMap.size} unknown fields (for potential matching)`);
    
    // Debug: Show sample of loaded fields
    console.log(`   Sample fields by organization:`);
    const orgIdToSlug = Object.fromEntries(
      Object.entries(orgSlugToId).map(([k, v]) => [v, k])
    );
    for (const [orgId, orgSlug] of Object.entries(orgIdToSlug)) {
      const orgFields = Array.from(correctFieldsByOrgAndSlug.keys())
        .filter(k => k.startsWith(orgId + ':'));
      const sampleSlugs = orgFields.slice(0, 5).map(k => k.split(':')[1]);
      console.log(`     ${orgSlug} (${orgId}): ${orgFields.length} fields`);
      if (sampleSlugs.length > 0) {
        console.log(`       Sample slugs: ${sampleSlugs.join(', ')}`);
      }
    }
    console.log('');
    
    // Load post types: postTypeId -> { orgId, slug }
    console.log('Loading post types...');
    const postTypesContent = await fs.readFile(POST_TYPES_CSV, 'utf-8');
    const postTypesLines = postTypesContent.split('\n').filter(line => line.trim());
    const postTypesHeader = postTypesLines[0]?.split(',');
    const postTypeIdIndex = postTypesHeader?.indexOf('id');
    const postTypeOrgIdIndex = postTypesHeader?.indexOf('organization_id');
    const postTypeSlugIndex = postTypesHeader?.indexOf('slug');
    
    const postTypes = new Map(); // postTypeId -> { orgId, slug }
    
    for (let i = 1; i < postTypesLines.length; i++) {
      const parts = parseCSVLine(postTypesLines[i]);
      const postTypeId = parts[postTypeIdIndex]?.trim();
      const orgId = parts[postTypeOrgIdIndex]?.trim();
      const slug = parts[postTypeSlugIndex]?.trim();
      
      if (postTypeId && orgId && slug) {
        postTypes.set(postTypeId, { orgId, slug });
      }
    }
    
    console.log(`   ✓ Loaded ${postTypes.size} post types`);
    
    // Load posts with slugs and post type
    console.log('Loading posts...');
    const postsContent = await fs.readFile(POSTS_CSV, 'utf-8');
    const postsLines = postsContent.split('\n').filter(line => line.trim());
    const postsHeader = postsLines[0]?.split(',');
    const postIdIndex = postsHeader?.indexOf('id');
    const orgIdIndex = postsHeader?.indexOf('organization_id');
    const postPostTypeIdIndex = postsHeader?.indexOf('post_type_id');
    const slugIndex = postsHeader?.indexOf('slug');
    
    const postInfo = new Map(); // postId -> { orgId, slug, postTypeSlug }
    const postSlugToId = new Map(); // orgId:slug -> newPostId
    
    for (let i = 1; i < postsLines.length; i++) {
      const parts = parseCSVLine(postsLines[i]);
      const postId = parts[postIdIndex]?.trim();
      const orgId = parts[orgIdIndex]?.trim();
      const postTypeId = parts[postPostTypeIdIndex]?.trim();
      const slug = parts[slugIndex]?.trim();
      
      if (postId && orgId && slug) {
        const postType = postTypes.get(postTypeId);
        const postTypeSlug = postType?.slug || null;
        postInfo.set(postId, { orgId, slug, postTypeSlug });
        postSlugToId.set(`${orgId}:${slug}`, postId);
      }
    }
    
    console.log(`   ✓ Loaded ${postInfo.size} posts\n`);
    
    // Load WordPress raw data: postId -> meta
    // Match by organization AND post type
    // Find ALL raw.json files recursively
    console.log('Loading WordPress raw data...');
    const postIdToWpMeta = new Map(); // newPostId -> { orgId, meta }
    const orgMetaKeys = new Map(); // orgId -> Set of meta keys found
    
    // Helper function to recursively find all raw.json files
    const findRawJsonFiles = async (dir) => {
      const files = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...await findRawJsonFiles(fullPath));
          } else if (entry.isFile() && entry.name === 'raw.json') {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip if directory doesn't exist
      }
      return files;
    };
    
    // Helper function to load posts from a raw.json file
    const loadPostsFromFile = async (rawJsonPath, orgId, postTypeSlug) => {
      try {
        const content = await fs.readFile(rawJsonPath, 'utf-8');
        const posts = JSON.parse(content);
        
        for (const wpPost of posts) {
          if (wpPost.id && wpPost.meta && wpPost.slug) {
            const wpSlug = String(wpPost.slug).trim();
            const key = `${orgId}:${wpSlug}`;
            const newPostId = postSlugToId.get(key);
            
            if (newPostId) {
              const post = postInfo.get(newPostId);
              // Match by organization AND post type
              if (post && post.postTypeSlug === postTypeSlug) {
                postIdToWpMeta.set(newPostId, { orgId, meta: wpPost.meta, wpPostId: wpPost.id, wpSlug });
              }
            }
          }
        }
      } catch (error) {
        // Skip if file doesn't exist or invalid JSON
      }
    };
    
    for (const orgSlug of Object.keys(orgSlugToId)) {
      const orgId = orgSlugToId[orgSlug];
      const orgDir = path.join(orgsDir, orgSlug);
      const rawDataDir = path.join(orgDir, 'raw-data');
      const metaKeysSet = new Set();
      
      console.log(`   Loading ${orgSlug}...`);
      let orgPostCount = 0;
      
      try {
        // Find all raw.json files recursively
        const rawJsonFiles = await findRawJsonFiles(rawDataDir);
        
        // Group files by post type slug (directory name)
        const filesByPostType = new Map();
        for (const filePath of rawJsonFiles) {
          // Extract post type from path: .../raw-data/{postType}/raw.json or .../raw-data/{postType}_/raw.json
          const relativePath = path.relative(rawDataDir, filePath);
          const dirName = path.dirname(relativePath);
          // Remove trailing underscore if present (e.g., "programs_" -> "programs")
          let postTypeSlug = dirName.replace(/_$/, '');
          
          // If dirName is "." (file is directly in raw-data), try to extract from filename
          // e.g., "programs_\raw.json" -> "programs"
          if (dirName === '.' || dirName === '') {
            const baseName = path.basename(filePath);
            // Check if filename is like "programs_\raw.json" or "programs_raw.json"
            const match = baseName.match(/^(.+?)_raw\.json$/);
            if (match && match[1] && match[1] !== 'raw') {
              postTypeSlug = match[1].replace(/_$/, '');
            } else if (baseName === 'raw.json') {
              // Just "raw.json" - can't determine post type from filename
              // Skip this file or use a default
              continue;
            }
          }
          
          if (!filesByPostType.has(postTypeSlug)) {
            filesByPostType.set(postTypeSlug, []);
          }
          filesByPostType.get(postTypeSlug).push(filePath);
        }
        
        // Load posts from each post type directory
        for (const [postTypeSlug, files] of filesByPostType.entries()) {
          for (const filePath of files) {
            await loadPostsFromFile(filePath, orgId, postTypeSlug);
          }
        }
        
        // Collect all meta keys from loaded posts
        for (const [postId, wpMeta] of postIdToWpMeta.entries()) {
          if (wpMeta.orgId === orgId && wpMeta.meta) {
            for (const metaKey of Object.keys(wpMeta.meta)) {
              if (!metaKey.startsWith('_') && !metaKey.startsWith('hs_') && metaKey !== 'footnotes' && metaKey !== 'content-type') {
                metaKeysSet.add(metaKey);
              }
            }
            orgPostCount++;
          }
        }
        
        orgMetaKeys.set(orgId, metaKeysSet);
        console.log(`     ✓ ${orgSlug}: ${orgPostCount} posts matched, ${metaKeysSet.size} unique meta keys`);
      } catch (error) {
        console.log(`     ⚠ ${orgSlug}: ${error.message}`);
      }
    }
    
    console.log(`   ✓ Total: ${postIdToWpMeta.size} posts with meta data\n`);
    
    // Load post_field_values
    console.log('Loading post_field_values...');
    const valuesContent = await fs.readFile(POST_FIELD_VALUES_CSV, 'utf-8');
    const valuesLines = valuesContent.split('\n').filter(line => line.trim());
    const valuesHeader = valuesLines[0]?.split(',');
    const pvPostIdIndex = valuesHeader?.indexOf('post_id');
    const pvFieldIdIndex = valuesHeader?.indexOf('custom_field_id');
    const pvValueIndex = valuesHeader?.indexOf('value');
    
    // Load all custom fields to identify unknown ones
    const allFieldsContent = await fs.readFile(CORRECT_FIELDS_CSV, 'utf-8');
    const allFieldsLines = allFieldsContent.split('\n').filter(line => line.trim());
    const unknownFields = new Set(); // Set of unknown field IDs
    
    for (let i = 1; i < allFieldsLines.length; i++) {
      const parts = parseCSVLine(allFieldsLines[i]);
      const id = parts[0]?.trim();
      const name = parts[2]?.trim();
      const slug = parts[3]?.trim();
      
      if (name === 'Unknown Field' || slug?.startsWith('unknown-field-')) {
        unknownFields.add(id);
      }
    }
    
    console.log(`   ✓ Found ${unknownFields.size} unknown field IDs\n`);
    
    // Map unknown fields to correct fields
    console.log('Mapping unknown fields to correct fields...');
    const fieldMappingCounts = new Map(); // unknownFieldId -> { correctFieldId -> count }
    const debugUnmatched = new Set(); // Track unique unmatched cases for debugging
    
    let processed = 0;
    let matched = 0;
    
    for (let i = 1; i < valuesLines.length; i++) {
      const parts = parseCSVLine(valuesLines[i]);
      const postId = parts[pvPostIdIndex]?.trim();
      const fieldId = parts[pvFieldIdIndex]?.trim();
      let value = parts[pvValueIndex];
      
      // Handle CSV escaping
      if (value && typeof value === 'string') {
        value = value.trim();
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
      
      // Get WordPress meta
      const wpMeta = postIdToWpMeta.get(postId);
      if (!wpMeta) {
        // Debug: track posts without meta
        if (processed <= 5) {
          process.stdout.write(`     ⚠ Post ${postId} (org: ${post.orgId}) has no WordPress meta\n`);
        }
        continue;
      }
      
      // Verify organization matches
      if (wpMeta.orgId !== post.orgId) {
        // Debug: track org mismatches
        if (processed <= 5) {
          process.stdout.write(`     ⚠ Post ${postId} org mismatch: post=${post.orgId}, meta=${wpMeta.orgId}\n`);
        }
        continue;
      }
      
      // Try to match value to a meta key
      let valueMatched = false;
      let matchedMetaKey = null;
      let fieldMapped = false;
      
      for (const [metaKey, metaValue] of Object.entries(wpMeta.meta)) {
        // Skip internal keys
        if (metaKey.startsWith('_') || metaKey.startsWith('hs_') || metaKey === 'footnotes' || metaKey === 'content-type') {
          continue;
        }
        
        // Skip empty values
        if (metaValue === null || metaValue === undefined || metaValue === '') {
          continue;
        }
        
        // Compare values (metaValue from WordPress, storedValue from post_field_values)
        if (valuesMatch(metaValue, value)) {
          valueMatched = true;
          matchedMetaKey = metaKey;
          
          // Try to map meta key to correct custom field ID
          // Strategy: Remove all dashes/underscores from both, then exact match
          const normalizedMetaKey = metaKey.replace(/[-_]/g, '').toLowerCase();
          
          // Try exact match first (with original meta key)
          let key = `${post.orgId}:${metaKey}`;
          let correctFieldId = correctFieldsByOrgAndSlug.get(key);
          
          // If not found, try with underscores instead of hyphens
          if (!correctFieldId) {
            const withUnderscores = metaKey.replace(/-/g, '_');
            key = `${post.orgId}:${withUnderscores}`;
            correctFieldId = correctFieldsByOrgAndSlug.get(key);
          }
          
          // If still not found, try with hyphens instead of underscores
          if (!correctFieldId) {
            const withHyphens = metaKey.replace(/_/g, '-');
            key = `${post.orgId}:${withHyphens}`;
            correctFieldId = correctFieldsByOrgAndSlug.get(key);
          }
          
          // If still not found, try exact match after removing all dashes/underscores
          // This matches word sequence exactly (e.g., "tuitionfeeswithdiscount" = "tuitionfeeswithdiscount")
          if (!correctFieldId) {
            // First check in correct fields by normalized key
            const normalizedKey = `${post.orgId}:${normalizedMetaKey}`;
            correctFieldId = correctFieldsByOrgAndNormalized.get(normalizedKey);
            
            // If not found, check in unknown fields section for potential match
            if (!correctFieldId) {
              const unknownField = unknownFieldsMap.get(normalizedKey);
              if (unknownField) {
                // Found a match in unknown section - use it
                correctFieldId = unknownField.id;
                // Track that we're using an "unknown" field that should be considered correct
                if (!fieldMappingCounts.has('_using_unknown_fields')) {
                  fieldMappingCounts.set('_using_unknown_fields', new Map());
                }
                const unknownCounts = fieldMappingCounts.get('_using_unknown_fields');
                const currentCount = unknownCounts.get(unknownField.id) || 0;
                unknownCounts.set(unknownField.id, currentCount + 1);
              }
            }
          }
          
          if (correctFieldId) {
            // Track mapping
            if (!fieldMappingCounts.has(fieldId)) {
              fieldMappingCounts.set(fieldId, new Map());
            }
            const counts = fieldMappingCounts.get(fieldId);
            const currentCount = counts.get(correctFieldId) || 0;
            counts.set(correctFieldId, currentCount + 1);
            matched++;
            fieldMapped = true;
            break;
          }
        }
      }
      
      // Debug: Show why matches aren't mapping (first 20 unique cases)
      if (valueMatched && !fieldMapped) {
        // Track unique unmatched cases
        const debugKey = `${post.orgId}:${matchedMetaKey}`;
        if (!debugUnmatched.has(debugKey) && debugUnmatched.size < 20) {
          debugUnmatched.add(debugKey);
          const availableFields = Array.from(correctFieldsByOrgAndSlug.keys())
            .filter(k => k.startsWith(post.orgId + ':'))
            .map(k => k.split(':')[1]);
          
          process.stdout.write(`\n   Debug [${debugUnmatched.size}]: Value matched but no field mapping\n`);
          process.stdout.write(`     Post: ${postId}, Org: ${post.orgId}, Meta key: "${matchedMetaKey}"\n`);
          process.stdout.write(`     Looking for: ${post.orgId}:${matchedMetaKey}\n`);
          process.stdout.write(`     Available slugs (${availableFields.length}): ${availableFields.slice(0, 15).join(', ')}\n`);
          process.stdout.write(`     Value: ${String(value).substring(0, 50)}\n`);
          
          // Show normalized comparison
          const normalizedMetaNoDashes = matchedMetaKey.replace(/[-_]/g, '').toLowerCase();
          process.stdout.write(`     Normalized (no dashes/underscores): "${normalizedMetaNoDashes}"\n`);
          
          // Check if this meta key exists in WordPress for this organization
          const orgMetaKeysForThisOrg = orgMetaKeys.get(post.orgId);
          if (orgMetaKeysForThisOrg && !orgMetaKeysForThisOrg.has(matchedMetaKey)) {
            process.stdout.write(`     ⚠ Meta key "${matchedMetaKey}" NOT found in WordPress for ${post.orgId}\n`);
            // Check if it exists in other organizations
            const foundInOrgs = [];
            for (const [otherOrgId, metaKeys] of orgMetaKeys.entries()) {
              if (otherOrgId !== post.orgId && metaKeys.has(matchedMetaKey)) {
                const orgSlug = Object.entries(orgSlugToId).find(([slug, id]) => id === otherOrgId)?.[0];
                foundInOrgs.push(orgSlug || otherOrgId);
              }
            }
            if (foundInOrgs.length > 0) {
              process.stdout.write(`     ⚠ But found in other org(s): ${foundInOrgs.join(', ')}\n`);
            }
          }
          
          // Show what meta keys ARE available for this post's WordPress data
          if (wpMeta && wpMeta.meta) {
            const availableMetaKeys = Object.keys(wpMeta.meta)
              .filter(k => !k.startsWith('_') && !k.startsWith('hs_') && k !== 'footnotes' && k !== 'content-type')
              .slice(0, 10);
            process.stdout.write(`     WordPress meta keys for this post: ${availableMetaKeys.join(', ')}\n`);
          }
          
          // Check if any available slug matches when normalized
          const matchingSlug = availableFields.find(slug => {
            const normalizedSlug = slug.replace(/[-_]/g, '').toLowerCase();
            return normalizedSlug === normalizedMetaNoDashes;
          });
          if (matchingSlug) {
            process.stdout.write(`     ✓ Would match: "${matchingSlug}"\n`);
          } else {
            // Show first few normalized slugs for comparison
            const normalizedSlugs = availableFields.slice(0, 5).map(s => s.replace(/[-_]/g, '').toLowerCase());
            process.stdout.write(`     Available normalized: ${normalizedSlugs.join(', ')}\n`);
          }
        }
      }
      
      if (processed % 10000 === 0) {
        const currentMappings = Array.from(fieldMappingCounts.entries())
          .filter(([uid, counts]) => {
            let maxCount = 0;
            for (const count of counts.values()) {
              if (count > maxCount) maxCount = count;
            }
            return maxCount >= 2;
          }).length;
        console.log(`   Processed ${processed}/${valuesLines.length - 1}, ${currentMappings} fields mapped...`);
      }
    }
    
    console.log(`\n   ✓ Processed ${processed} post_field_values`);
    console.log(`   ✓ Found ${matched} value matches\n`);
    
    // Determine final mappings (require at least 2 matches for confidence)
    const fieldMapping = new Map(); // unknownFieldId -> correctFieldId
    
    for (const [unknownFieldId, counts] of fieldMappingCounts.entries()) {
      let maxCount = 0;
      let bestFieldId = null;
      
      for (const [correctFieldId, count] of counts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          bestFieldId = correctFieldId;
        }
      }
      
      // Lower threshold to 1 match for now to catch more mappings
      // We can review and filter later if needed
      if (bestFieldId && maxCount >= 1) {
        fieldMapping.set(unknownFieldId, bestFieldId);
      }
    }
    
    console.log(`   ✓ Mapped ${fieldMapping.size} unknown fields to correct fields\n`);
    
    // Generate SQL
    if (fieldMapping.size > 0) {
      console.log('Generating SQL...');
      const sqlStatements = [];
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('-- Update post_field_values: Map Unknown Fields to Proper Custom Fields');
      sqlStatements.push(`-- Total mappings: ${fieldMapping.size}`);
      sqlStatements.push('-- Generated by comparing values with WordPress meta data');
      sqlStatements.push('-- ============================================================================');
      sqlStatements.push('');
      
      // Group by correct field ID
      const updatesByCorrectField = new Map();
      for (const [unknownId, correctId] of fieldMapping.entries()) {
        if (!updatesByCorrectField.has(correctId)) {
          updatesByCorrectField.set(correctId, []);
        }
        updatesByCorrectField.get(correctId).push(unknownId);
      }
      
      for (const [correctFieldId, unknownFieldIds] of updatesByCorrectField.entries()) {
        // Check if this field came from unknown section
        let field = correctFields.get(correctFieldId);
        let fieldInfo = field ? `${field.name} (${field.slug})` : correctFieldId;
        
        // Check unknown fields map
        if (!field) {
          for (const [key, unknownField] of unknownFieldsMap.entries()) {
            if (unknownField.id === correctFieldId) {
              fieldInfo = `${unknownField.name} (${unknownField.slug}) [from unknown section]`;
              break;
            }
          }
        }
        
        sqlStatements.push(`-- Mapping ${unknownFieldIds.length} unknown fields to: ${fieldInfo}`);
        sqlStatements.push('');
        
        // Update in batches
        // Strategy: Use a single UPDATE with WHERE clause that prevents duplicates
        const batchSize = 100;
        for (let i = 0; i < unknownFieldIds.length; i += batchSize) {
          const batch = unknownFieldIds.slice(i, i + batchSize);
          const idsList = batch.map(id => `'${id}'`).join(',');
          
          sqlStatements.push(`-- Batch ${Math.floor(i / batchSize) + 1}: Delete duplicates first (keep one per post)`);
          sqlStatements.push(`DELETE FROM post_field_values`);
          sqlStatements.push(`WHERE custom_field_id IN (${idsList})`);
          sqlStatements.push(`  AND id NOT IN (`);
          sqlStatements.push(`    SELECT MIN(id) FROM post_field_values`);
          sqlStatements.push(`    WHERE custom_field_id IN (${idsList})`);
          sqlStatements.push(`    GROUP BY post_id`);
          sqlStatements.push(`  );`);
          sqlStatements.push('');
          
          sqlStatements.push(`-- Batch ${Math.floor(i / batchSize) + 1}: Update only rows that won't create duplicates`);
          sqlStatements.push(`UPDATE post_field_values`);
          sqlStatements.push(`SET custom_field_id = '${correctFieldId}'`);
          sqlStatements.push(`WHERE custom_field_id IN (${idsList})`);
          sqlStatements.push(`  AND NOT EXISTS (`);
          sqlStatements.push(`    SELECT 1 FROM post_field_values pfv2`);
          sqlStatements.push(`    WHERE pfv2.post_id = post_field_values.post_id`);
          sqlStatements.push(`      AND pfv2.custom_field_id = '${correctFieldId}'`);
          sqlStatements.push(`      AND pfv2.id != post_field_values.id`);
          sqlStatements.push(`  );`);
          sqlStatements.push('');
          
          sqlStatements.push(`-- Batch ${Math.floor(i / batchSize) + 1}: Delete remaining unknown field rows that couldn't be updated`);
          sqlStatements.push(`DELETE FROM post_field_values`);
          sqlStatements.push(`WHERE custom_field_id IN (${idsList});`);
          sqlStatements.push('');
        }
      }
      
      // Report on fields found in unknown section
      const usingUnknownFields = fieldMappingCounts.get('_using_unknown_fields');
      if (usingUnknownFields && usingUnknownFields.size > 0) {
        sqlStatements.push('');
        sqlStatements.push('-- ============================================================================');
        sqlStatements.push('-- NOTE: Some mappings use fields from the "unknown fields" section');
        sqlStatements.push(`-- These fields (${usingUnknownFields.size} total) should be considered correct`);
        sqlStatements.push('-- and may need to be renamed/updated in the custom_fields table');
        sqlStatements.push('-- ============================================================================');
      }
      
      const sqlPath = path.join(__dirname, 'map-unknown-fields-via-values.sql');
      await fs.writeFile(sqlPath, sqlStatements.join('\n'), 'utf-8');
      console.log(`   ✓ Generated: ${sqlPath}\n`);
    }
    
    console.log('============================================================');
    console.log('NEXT STEPS');
    console.log('============================================================');
    console.log('1. Review map-unknown-fields-via-values.sql');
    console.log('2. Run the SQL to update post_field_values');
    console.log('3. Update post_type_fields to use correct field IDs');
    console.log('4. Delete unknown field custom fields');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
