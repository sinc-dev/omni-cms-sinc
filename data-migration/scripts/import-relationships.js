/**
 * Import Post Relationships to Omni-CMS
 * 
 * Creates post-to-post relationships (e.g., Programs → Universities)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRequest, createPostRelationship } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create university name to post ID mapping
 */
async function createUniversityNameMap(orgSlug, postMap) {
  const nameMap = new Map(); // Maps university name -> Omni-CMS post ID

  // Load universities from transformed data
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
        nameMap.set(university.title.toLowerCase().trim(), omniId);
        
        // Also map by custom field name if available
        if (university.customFields?.university_name) {
          nameMap.set(university.customFields.university_name.toLowerCase().trim(), omniId);
        }
      }
    }
  } catch (error) {
    console.warn(`   ⚠ Could not load universities: ${error.message}`);
  }

  return nameMap;
}

/**
 * Import relationships for an organization
 */
export async function importRelationships(baseUrl, orgId, orgSlug, postMap) {
  // Create university name mapping
  const universityNameMap = await createUniversityNameMap(orgSlug, postMap);
  console.log(`   Found ${universityNameMap.size} universities for relationship mapping`);

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

  for (const program of programs) {
    if (!program.relationships?.university) continue;

    const wpProgramId = program.metadata.wordpressId;
    const omniProgramId = postMap.get(wpProgramId);
    
    if (!omniProgramId) {
      skipped++;
      continue;
    }

    const universityName = program.relationships.university.wordpressName;
    const universityId = universityNameMap.get(universityName.toLowerCase().trim());

    if (!universityId) {
      console.warn(`   ⚠ University not found: "${universityName}"`);
      skipped++;
      continue;
    }

    try {
      await createPostRelationship(baseUrl, orgId, omniProgramId, {
        toPostId: universityId,
        relationshipType: 'university',
      });
      created++;
    } catch (error) {
      console.error(`   ✗ Failed to create relationship for program ${program.title}:`, error.message);
      failed++;
    }
  }

  console.log(`   ✓ Created ${created} relationships (${skipped} skipped, ${failed} failed)`);
}

