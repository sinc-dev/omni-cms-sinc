/**
 * Run Comparison and Generate SQL
 * 
 * Convenience script to run comparison and SQL generation in one go
 */

import { compareWithDb } from './compare-with-db.js';
import { generateSQLFixes } from './generate-sql-fixes.js';

async function main() {
  const baseUrl = process.env.OMNI_CMS_BASE_URL || 'http://localhost:8787';
  const orgSlug = process.argv[2] || 'study-in-north-cyprus';
  const apiKey = process.env.OMNI_CMS_API_KEY;

  if (!apiKey) {
    console.error('Error: OMNI_CMS_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    // Step 1: Compare with database
    console.log('Step 1: Comparing local data with database...\n');
    await compareWithDb(baseUrl, orgSlug, apiKey);

    // Step 2: Generate SQL fixes
    console.log('\nStep 2: Generating SQL fixes...\n');
    await generateSQLFixes(orgSlug);

    console.log('\n✅ Comparison and SQL generation complete!');
    console.log(`\n📁 Check these files:`);
    console.log(`   - data-migration/organizations/${orgSlug}/db-cache/ (cached DB data)`);
    console.log(`   - data-migration/organizations/${orgSlug}/comparison-report.json`);
    console.log(`   - data-migration/organizations/${orgSlug}/sql-fixes.sql\n`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

