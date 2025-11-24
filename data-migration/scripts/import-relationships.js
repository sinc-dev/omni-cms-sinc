/**
 * Import Post Relationships to Omni-CMS
 * 
 * Creates post-to-post relationships (e.g., Programs → Universities)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createPostRelationship, getExistingPosts } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Normalize university name for matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Extract name variations from a university name
 * e.g., "Altinbas International University (World Peace University)" 
 * -> ["altinbas international university (world peace university)", "world peace university", "altinbas international university"]
 */
function getNameVariations(name) {
  const normalized = normalizeName(name);
  const variations = [normalized];
  
  // Extract text in parentheses
  const parenMatch = normalized.match(/\(([^)]+)\)/);
  if (parenMatch) {
    variations.push(normalizeName(parenMatch[1]));
  }
  
  // Extract text before parentheses
  const beforeParen = normalized.split('(')[0].trim();
  if (beforeParen && beforeParen !== normalized) {
    variations.push(beforeParen);
  }
  
  // Remove common suffixes/prefixes and add variations
  const withoutCommon = normalized
    .replace(/\b(university|univ|college|institute|school)\b/gi, '')
    .trim();
  if (withoutCommon && withoutCommon !== normalized) {
    variations.push(withoutCommon);
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Create university name to post ID mapping
 * Fetches existing universities from API and also checks transformed data
 * Creates multiple name variations for fuzzy matching
 */
async function createUniversityNameMap(baseUrl, orgId, orgSlug, postMap, apiKey) {
  const nameMap = new Map(); // Maps university name -> Omni-CMS post ID
  const universityRecords = []; // Store full records for fuzzy matching

  // First, try to get university post type ID
  let universityPostTypeId = null;
  try {
    const postTypesPath = path.join(
      __dirname,
      `../organizations/${orgSlug}/import-mappings/post-types.json`
    );
    const postTypesData = await fs.readFile(postTypesPath, 'utf-8');
    const postTypes = JSON.parse(postTypesData);
    universityPostTypeId = postTypes['universities'] || postTypes['university'];
  } catch (error) {
    console.warn(`   ⚠ Could not load post type mappings: ${error.message}`);
  }

  // Fetch existing universities from API (includes ones that were skipped during import)
  if (universityPostTypeId) {
    try {
      const existingUniversities = await getExistingPosts(baseUrl, orgId, universityPostTypeId, apiKey);
      for (const university of existingUniversities) {
        if (university.title) {
          const normalized = normalizeName(university.title);
          nameMap.set(normalized, university.id);
          
          // Add name variations for fuzzy matching
          const variations = getNameVariations(university.title);
          for (const variation of variations) {
            if (!nameMap.has(variation)) {
              nameMap.set(variation, university.id);
            }
          }
          
          // Store for fuzzy matching fallback
          universityRecords.push({
            id: university.id,
            title: university.title,
            normalized: normalized,
          });
        }
      }
      console.log(`   Loaded ${existingUniversities.length} universities from API`);
    } catch (error) {
      console.warn(`   ⚠ Could not fetch universities from API: ${error.message}`);
    }
  }

  // Also load from transformed data to catch any that might not be in API yet
  const universitiesPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/transformed/universities/transformed.json`
  );

  try {
    const content = await fs.readFile(universitiesPath, 'utf-8');
    const universities = JSON.parse(content);

    for (const university of universities) {
      const wpId = university.metadata.wordpressId;
      const omniId = postMap.get(wpId);
      
      if (omniId && university.title) {
        const normalized = normalizeName(university.title);
        
        // Only add if not already in map (API takes precedence)
        if (!nameMap.has(normalized)) {
          nameMap.set(normalized, omniId);
          
          // Add name variations
          const variations = getNameVariations(university.title);
          for (const variation of variations) {
            if (!nameMap.has(variation)) {
              nameMap.set(variation, omniId);
            }
          }
        }
        
        // Also map by custom field name if available
        if (university.customFields?.university_name) {
          const customFieldName = normalizeName(university.customFields.university_name);
          if (!nameMap.has(customFieldName)) {
            nameMap.set(customFieldName, omniId);
            
            // Add variations for custom field name too
            const variations = getNameVariations(university.customFields.university_name);
            for (const variation of variations) {
              if (!nameMap.has(variation)) {
                nameMap.set(variation, omniId);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    // This is okay if file doesn't exist
  }

  return { nameMap, universityRecords };
}

/**
 * Find university ID using fuzzy matching
 * Checks if the search name is contained in any university name or vice versa
 */
function findUniversityIdFuzzy(searchName, nameMap, universityRecords) {
  const normalizedSearch = normalizeName(searchName);
  
  // First try exact match
  if (nameMap.has(normalizedSearch)) {
    return nameMap.get(normalizedSearch);
  }
  
  // Try variations of the search name
  const searchVariations = getNameVariations(searchName);
  for (const variation of searchVariations) {
    if (nameMap.has(variation)) {
      return nameMap.get(variation);
    }
  }
  
  // Fuzzy match: check if search name is contained in any university name
  for (const record of universityRecords) {
    // Check if search name is contained in university name
    if (record.normalized.includes(normalizedSearch) || normalizedSearch.includes(record.normalized)) {
      // Make sure it's a meaningful match (at least 5 characters)
      if (normalizedSearch.length >= 5 || record.normalized.length >= 5) {
        return record.id;
      }
    }
  }
  
  return null;
}

/**
 * Import relationships for an organization
 */
export async function importRelationships(baseUrl, orgId, orgSlug, postMap, apiKey = null) {
  // Create university name mapping (fetches from API + transformed data)
  const { nameMap, universityRecords } = await createUniversityNameMap(baseUrl, orgId, orgSlug, postMap, apiKey);
  console.log(`   Found ${nameMap.size} university name variations for relationship mapping`);

  // Load programs with relationships
  const programsPath = path.join(
    __dirname,
    `../organizations/${orgSlug}/transformed/programs/transformed.json`
  );

  let programs = [];
  try {
    const content = await fs.readFile(programsPath, 'utf-8');
    programs = JSON.parse(content);
  } catch (error) {
    console.warn(`   ⚠ Could not load programs: ${error.message}`);
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;
  let fuzzyMatched = 0;

  // Filter programs that need relationships
  const programsWithRelationships = programs.filter(p => p.relationships?.university);
  console.log(`   Processing ${programsWithRelationships.length} programs with relationships...`);

  // Process in batches for better performance
  const BATCH_SIZE = 50;
  let processed = 0;
  const missingUniversities = new Set(); // Track missing universities for reporting

  for (let i = 0; i < programsWithRelationships.length; i += BATCH_SIZE) {
    const batch = programsWithRelationships.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (program) => {
      const wpProgramId = program.metadata.wordpressId;
      const omniProgramId = postMap.get(wpProgramId);
      
      if (!omniProgramId) {
        skipped++;
        return;
      }

      const universityName = program.relationships.university.wordpressName;
      
      // Try exact match first
      let universityId = nameMap.get(normalizeName(universityName));
      
      // If not found, try fuzzy matching
      if (!universityId) {
        universityId = findUniversityIdFuzzy(universityName, nameMap, universityRecords);
        if (universityId) {
          fuzzyMatched++;
        }
      }

      if (!universityId) {
        missingUniversities.add(universityName);
        skipped++;
        return;
      }

      try {
        await createPostRelationship(baseUrl, orgId, omniProgramId, {
          toPostId: universityId,
          relationshipType: 'university',
        });
        created++;
      } catch (error) {
        // Check if it's a duplicate/constraint error (relationship already exists)
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('already exists') || 
            errorMsg.includes('UNIQUE constraint') || 
            errorMsg.includes('duplicate') ||
            errorMsg.includes('SQLITE_CONSTRAINT')) {
          skipped++;
        } else {
          // Only log first few errors to avoid spam
          if (failed < 5) {
            console.error(`   ✗ Failed to create relationship for program ${program.title}:`, errorMsg);
          }
          failed++;
        }
      }
    }));

    processed += batch.length;
    if (processed % 500 === 0 || processed === programsWithRelationships.length) {
      console.log(`   Progress: ${processed}/${programsWithRelationships.length} processed`);
    }

    // Small delay between batches to avoid overwhelming the API
    if (i + BATCH_SIZE < programsWithRelationships.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Report missing universities
  if (missingUniversities.size > 0) {
    console.log(`   ⚠ Could not match ${missingUniversities.size} university name(s):`);
    Array.from(missingUniversities).slice(0, 10).forEach(name => {
      console.log(`      - "${name}"`);
    });
    if (missingUniversities.size > 10) {
      console.log(`      ... and ${missingUniversities.size - 10} more`);
    }
  }

  if (fuzzyMatched > 0) {
    console.log(`   ✓ Fuzzy matched ${fuzzyMatched} university names`);
  }

  console.log(`   ✓ Created ${created} relationships (${skipped} skipped, ${failed} failed)`);
}

