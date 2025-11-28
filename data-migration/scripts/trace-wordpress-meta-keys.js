/**
 * Trace WordPress Meta Keys
 * 
 * Scans all raw.json files across all organizations and post types
 * to extract unique meta keys and identify which ones don't have
 * matching custom fields.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const orgsDir = path.join(__dirname, '..', 'organizations');
const orgSlugToId = {
  'study-in-north-cyprus': '3Kyv3hvrybf_YohTZRgPV',
  'study-in-kazakhstan': 'IBfLssGjH23-f9uxjH5Ms',
  'paris-american-international-university': 'ND-k8iHHx70s5XaW28Mk2'
};

/**
 * Recursively find all raw.json files
 */
async function findRawJsonFiles(dir) {
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
}

/**
 * Normalize a string by removing dashes/underscores and lowercasing
 */
function normalize(str) {
  return str.replace(/[-_]/g, '').toLowerCase();
}

async function main() {
  process.stdout.write('Starting trace script...\n');
  console.log('============================================================');
  console.log('Trace WordPress Meta Keys');
  console.log('============================================================');
  console.log('');

  // Load existing custom fields from CSV
  const CSV_DIR = path.join(__dirname, 'db-28-11-2025');
  const CUSTOM_FIELDS_CSV = path.join(CSV_DIR, 'custom_fields_table_more_recent.csv');
  
  console.log('Loading existing custom fields...');
  const customFieldsContent = await fs.readFile(CUSTOM_FIELDS_CSV, 'utf-8');
  const customFieldsLines = customFieldsContent.split('\n').filter(line => line.trim());
  
  // Parse CSV line (simple version for this script)
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

  // Load all custom fields (both correct and unknown)
  const existingFields = new Map(); // orgId:normalizedSlug -> { id, orgId, name, slug, isUnknown }
  const existingFieldsByOrg = new Map(); // orgId -> Set of normalized slugs

  for (let i = 1; i < customFieldsLines.length; i++) {
    const parts = parseCSVLine(customFieldsLines[i]);
    const id = parts[0]?.trim();
    const orgId = parts[1]?.trim();
    const name = parts[2]?.trim();
    const slug = parts[3]?.trim();

    if (id && orgId && slug) {
      const normalizedSlug = normalize(slug);
      const key = `${orgId}:${normalizedSlug}`;
      const isUnknown = name === 'Unknown Field' || slug.startsWith('unknown-field-');
      
      existingFields.set(key, { id, orgId, name, slug, isUnknown });
      
      if (!existingFieldsByOrg.has(orgId)) {
        existingFieldsByOrg.set(orgId, new Set());
      }
      existingFieldsByOrg.get(orgId).add(normalizedSlug);
    }
  }

  console.log(`   ✓ Loaded ${existingFields.size} custom fields (including unknown)\n`);

  // Trace meta keys from all raw.json files
  console.log('Tracing WordPress meta keys...');
  const metaKeysByOrg = new Map(); // orgId -> Map of postType -> Set of meta keys
  const metaKeysByOrgAndPostType = new Map(); // orgId:postType -> Set of meta keys

  for (const orgSlug of Object.keys(orgSlugToId)) {
    const orgId = orgSlugToId[orgSlug];
    const orgDir = path.join(orgsDir, orgSlug);
    const rawDataDir = path.join(orgDir, 'raw-data');

    console.log(`   Scanning ${orgSlug}...`);

    const orgMetaKeys = new Map(); // postType -> Set of meta keys
    const rawJsonFiles = await findRawJsonFiles(rawDataDir);

    // Group files by post type
    const filesByPostType = new Map();
    for (const filePath of rawJsonFiles) {
      const relativePath = path.relative(rawDataDir, filePath);
      const dirName = path.dirname(relativePath);
      let postTypeSlug = dirName.replace(/_$/, '');

      // Handle files directly in raw-data (e.g., programs_\raw.json)
      if (dirName === '.' || dirName === '') {
        const baseName = path.basename(filePath);
        const match = baseName.match(/^(.+?)_raw\.json$/);
        if (match && match[1] && match[1] !== 'raw') {
          postTypeSlug = match[1].replace(/_$/, '');
        } else {
          continue; // Skip if can't determine post type
        }
      }

      if (!filesByPostType.has(postTypeSlug)) {
        filesByPostType.set(postTypeSlug, []);
      }
      filesByPostType.get(postTypeSlug).push(filePath);
    }

    // Load meta keys from each post type
    for (const [postTypeSlug, files] of filesByPostType.entries()) {
      const metaKeysSet = new Set();

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const posts = JSON.parse(content);

          for (const wpPost of posts) {
            if (wpPost.meta) {
              for (const metaKey of Object.keys(wpPost.meta)) {
                // Skip internal keys
                if (!metaKey.startsWith('_') && 
                    !metaKey.startsWith('hs_') && 
                    metaKey !== 'footnotes' && 
                    metaKey !== 'content-type' &&
                    wpPost.meta[metaKey] !== null &&
                    wpPost.meta[metaKey] !== undefined &&
                    wpPost.meta[metaKey] !== '') {
                  metaKeysSet.add(metaKey);
                }
              }
            }
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }

      if (metaKeysSet.size > 0) {
        orgMetaKeys.set(postTypeSlug, metaKeysSet);
        const key = `${orgId}:${postTypeSlug}`;
        metaKeysByOrgAndPostType.set(key, metaKeysSet);
      }
    }

    metaKeysByOrg.set(orgId, orgMetaKeys);
    const totalMetaKeys = Array.from(orgMetaKeys.values()).reduce((sum, set) => sum + set.size, 0);
    console.log(`     ✓ Found ${totalMetaKeys} unique meta keys across ${orgMetaKeys.size} post types`);
  }

  console.log('');

  // Analyze matches
  console.log('Analyzing matches...');
  const unmatchedMetaKeys = new Map(); // orgId -> Map of postType -> Array of { metaKey, normalized, suggestions }
  const matchedInUnknown = new Map(); // orgId -> Array of { metaKey, fieldId, fieldSlug }

  for (const [orgId, postTypes] of metaKeysByOrg.entries()) {
    const orgUnmatched = new Map();
    const orgMatchedInUnknown = [];

    for (const [postTypeSlug, metaKeys] of postTypes.entries()) {
      const unmatched = [];

      for (const metaKey of metaKeys) {
        const normalizedMetaKey = normalize(metaKey);
        const key = `${orgId}:${normalizedMetaKey}`;
        const existingField = existingFields.get(key);

        if (!existingField) {
          // Not found - check if there's a similar field in unknown section
          const orgFields = existingFieldsByOrg.get(orgId) || new Set();
          const suggestions = [];

          // Look for potential matches in unknown fields
          for (const [fieldKey, fieldData] of existingFields.entries()) {
            if (fieldKey.startsWith(orgId + ':') && fieldData.isUnknown) {
              const fieldNormalized = normalize(fieldData.slug);
              if (fieldNormalized === normalizedMetaKey) {
                suggestions.push({
                  fieldId: fieldData.id,
                  fieldSlug: fieldData.slug,
                  fieldName: fieldData.name
                });
              }
            }
          }

          unmatched.push({
            metaKey,
            normalized: normalizedMetaKey,
            suggestions
          });

          if (suggestions.length > 0) {
            orgMatchedInUnknown.push({
              metaKey,
              normalized: normalizedMetaKey,
              fieldId: suggestions[0].fieldId,
              fieldSlug: suggestions[0].fieldSlug,
              fieldName: suggestions[0].fieldName
            });
          }
        }
      }

      if (unmatched.length > 0) {
        orgUnmatched.set(postTypeSlug, unmatched);
      }
    }

    if (orgUnmatched.size > 0) {
      unmatchedMetaKeys.set(orgId, orgUnmatched);
    }
    if (orgMatchedInUnknown.length > 0) {
      matchedInUnknown.set(orgId, orgMatchedInUnknown);
    }
  }

  // Generate report
  console.log('============================================================');
  console.log('ANALYSIS REPORT');
  console.log('============================================================');
  console.log('');

  const orgIdToSlug = Object.fromEntries(
    Object.entries(orgSlugToId).map(([slug, id]) => [id, slug])
  );

  // Report: Fields found in unknown section that match
  if (matchedInUnknown.size > 0) {
    console.log('FIELDS FOUND IN UNKNOWN SECTION (Should be considered correct):');
    console.log('');
    for (const [orgId, matches] of matchedInUnknown.entries()) {
      const orgSlug = orgIdToSlug[orgId];
      console.log(`  ${orgSlug} (${orgId}):`);
      for (const match of matches) {
        console.log(`    Meta key: "${match.metaKey}"`);
        console.log(`      → Matches unknown field: ${match.fieldSlug} (${match.fieldId})`);
        console.log(`      → Normalized: "${match.normalized}"`);
        console.log('');
      }
    }
    console.log('');
  }

  // Report: Completely missing fields
  if (unmatchedMetaKeys.size > 0) {
    console.log('COMPLETELY MISSING FIELDS (Need to be created):');
    console.log('');
    for (const [orgId, postTypes] of unmatchedMetaKeys.entries()) {
      const orgSlug = orgIdToSlug[orgId];
      console.log(`  ${orgSlug} (${orgId}):`);
      
      for (const [postTypeSlug, unmatched] of postTypes.entries()) {
        const trulyMissing = unmatched.filter(u => u.suggestions.length === 0);
        if (trulyMissing.length > 0) {
          console.log(`    Post type: ${postTypeSlug}`);
          for (const item of trulyMissing) {
            console.log(`      Meta key: "${item.metaKey}"`);
            console.log(`        Normalized: "${item.normalized}"`);
            console.log(`        Suggested slug: "${item.metaKey.replace(/-/g, '_')}"`);
            console.log('');
          }
        }
      }
    }
  }

  // Save detailed report to JSON
  const report = {
    timestamp: new Date().toISOString(),
    organizations: {}
  };

  for (const [orgId, postTypes] of metaKeysByOrg.entries()) {
    const orgSlug = orgIdToSlug[orgId];
    report.organizations[orgSlug] = {
      orgId,
      postTypes: {}
    };

    for (const [postTypeSlug, metaKeys] of postTypes.entries()) {
      const metaKeysArray = Array.from(metaKeys);
      const analysis = metaKeysArray.map(metaKey => {
        const normalizedMetaKey = normalize(metaKey);
        const key = `${orgId}:${normalizedMetaKey}`;
        const existingField = existingFields.get(key);
        
        return {
          metaKey,
          normalized: normalizedMetaKey,
          hasMatchingField: !!existingField,
          matchingField: existingField ? {
            id: existingField.id,
            slug: existingField.slug,
            name: existingField.name,
            isUnknown: existingField.isUnknown
          } : null
        };
      });

      report.organizations[orgSlug].postTypes[postTypeSlug] = {
        metaKeys: metaKeysArray,
        analysis
      };
    }
  }

  const reportPath = path.join(__dirname, 'trace-wordpress-meta-keys-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✓ Detailed report saved to: ${reportPath}`);
  console.log('');
}

main().catch(console.error);

