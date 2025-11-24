/**
 * Explore WordPress Sites
 * 
 * Analyzes WordPress sites to understand their data structure
 * before migration
 */

import { analyzeWordPressSite, generateReport } from '../shared/utils/wordpress-explorer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load WordPress credentials
async function loadWordPressAuth() {
  try {
    const envPath = path.join(__dirname, '../.env.wordpress-auth');
    const envContent = await fs.readFile(envPath, 'utf-8');
    const username = envContent.match(/WORDPRESS_USERNAME=(.+)/)?.[1]?.trim();
    const password = envContent.match(/WORDPRESS_PASSWORD=(.+)/)?.[1]?.trim();
    
    if (username && password) {
      return { username, password };
    }
  } catch (error) {
    console.warn('⚠ Could not load WordPress credentials from .env.wordpress-auth');
    console.warn('  Some endpoints may require authentication');
  }
  return null;
}

const SITES = [
  {
    name: 'Study In Kazakhstan',
    baseUrl: 'https://studyinkzk.com',
    slug: 'study-in-kazakhstan',
    customPostTypes: ['team-members', 'universities', 'programs'],
  },
  {
    name: 'Study in North Cyprus',
    baseUrl: 'https://studyinnc.com',
    slug: 'study-in-north-cyprus',
    customPostTypes: ['team-members', 'universities', 'programs'],
  },
  {
    name: 'Paris American International University',
    baseUrl: '', // TODO: Add actual URL
    slug: 'paris-american-international-university',
    customPostTypes: ['academic-staff', 'programs'],
  },
];

async function main() {
  console.log('WordPress Site Explorer');
  console.log('='.repeat(60));
  console.log('This script will analyze WordPress sites to understand their data structure.');
  console.log('It will examine:');
  console.log('  - Post types and their fields');
  console.log('  - Categories and tags');
  console.log('  - Authors and user data');
  console.log('  - Dates (created, updated, published)');
  console.log('  - Relationships between entities');
  console.log('  - Media structure');
  console.log('='.repeat(60));

  // Load WordPress authentication
  const auth = await loadWordPressAuth();
  if (auth) {
    console.log('\n✓ WordPress credentials loaded');
  }

  const results = [];

  for (const site of SITES) {
    const siteWithAuth = { ...site, auth };
    if (!site.baseUrl) {
      console.log(`\n⚠ Skipping ${site.name} - no baseUrl configured`);
      continue;
    }

    try {
      const analysis = await analyzeWordPressSite(siteWithAuth);
      results.push(analysis);

      // Save individual report
      const reportPath = path.join(
        __dirname,
        `../organizations/${site.slug}/analysis-report.json`
      );
      await generateReport(analysis, reportPath);
      console.log(`\n✓ Report saved to: ${reportPath}`);

      // Print summary
      console.log('\n' + '─'.repeat(60));
      console.log('SUMMARY:');
      console.log(`  Post Types: ${Object.keys(analysis.postTypes || {}).length}`);
      console.log(`  Categories: ${analysis.taxonomies?.categories?.count || 0}`);
      console.log(`  Tags: ${analysis.taxonomies?.tags?.count || 0}`);
      console.log(`  Authors: ${analysis.authors?.count || 0}`);
      console.log('─'.repeat(60));
    } catch (error) {
      console.error(`\n✗ Error analyzing ${site.name}:`, error.message);
    }
  }

  // Generate combined report
  const combinedReportPath = path.join(__dirname, '../wordpress-analysis-combined.json');
  await generateReport(
    {
      sites: results,
      analyzedAt: new Date().toISOString(),
    },
    combinedReportPath
  );

  console.log(`\n✓ Combined report saved to: ${combinedReportPath}`);
  console.log('\n✓ Analysis complete!');
}

main().catch(console.error);

