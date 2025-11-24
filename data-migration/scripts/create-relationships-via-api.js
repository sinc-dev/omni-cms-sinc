/**
 * Create Missing Relationships via API
 * 
 * Alternative to SQL: Creates missing relationships using the API
 * This is safer than direct SQL and validates data
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrganizationId, apiRequest, createPostRelationship } from '../shared/utils/api-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create missing relationships from comparison report
 */
export async function createMissingRelationships(baseUrl, orgSlug, apiKey) {
  console.log(`\n🔗 Creating missing relationships for: ${orgSlug}`);

  // Load comparison report
  const reportPath = path.join(__dirname, `../organizations/${orgSlug}/comparison-report.json`);
  const reportContent = await fs.readFile(reportPath, 'utf-8');
  const report = JSON.parse(reportContent);

  const orgId = await getOrganizationId(baseUrl, orgSlug, apiKey);
  const missingRelationships = report.relationships?.missing_program_university || [];

  if (missingRelationships.length === 0) {
    console.log('   ✓ No missing relationships found');
    return;
  }

  console.log(`   Found ${missingRelationships.length} missing relationships\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const rel of missingRelationships) {
    try {
      // Check if relationship already exists
      const checkUrl = `${baseUrl}/api/admin/v1/organizations/${orgId}/posts/${rel.programId}`;
      const postData = await apiRequest(checkUrl, { apiKey });
      
      if (postData.success && postData.data) {
        const existingRels = postData.data.relationships || [];
        const alreadyExists = existingRels.some(r => 
          r.targetPostId === rel.universityId && r.relationshipType === 'university'
        );

        if (alreadyExists) {
          console.log(`   ⏭️  Relationship already exists: ${rel.programTitle} -> ${rel.universityTitle}`);
          skipped++;
          continue;
        }
      }

      // Create relationship
      await createPostRelationship(baseUrl, orgId, rel.programId, {
        targetPostId: rel.universityId,
        relationshipType: 'university',
      });

      console.log(`   ✓ Created: ${rel.programTitle} -> ${rel.universityTitle}`);
      created++;
    } catch (error) {
      console.error(`   ✗ Failed: ${rel.programTitle} -> ${rel.universityTitle}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n   Summary: ${created} created, ${skipped} skipped, ${failed} failed\n`);
}

/**
 * CLI execution
 */
async function main() {
  const baseUrl = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
  const orgSlug = process.argv[2] || 'study-in-north-cyprus';
  const apiKey = process.env.OMNI_CMS_API_KEY;

  if (!apiKey) {
    console.error('Error: OMNI_CMS_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    await createMissingRelationships(baseUrl, orgSlug, apiKey);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

