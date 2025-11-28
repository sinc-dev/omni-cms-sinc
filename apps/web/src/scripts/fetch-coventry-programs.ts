#!/usr/bin/env node

/**
 * Script to fetch programs from Coventry University from production Cloudflare D1 database
 * 
 * Usage:
 *   pnpm fetch:coventry
 *   or
 *   tsx apps/web/src/scripts/fetch-coventry-programs.ts
 */

import { execSync, spawnSync } from 'child_process';
import { join } from 'path';

interface Program {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  published_at: number | null;
  organization_id: string;
  organization_slug: string | null;
}

interface WranglerResult {
  success: boolean;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
  results: Array<{
    success: boolean;
    meta: {
      duration: number;
      size_after: number;
      rows_read: number;
      rows_written: number;
    };
    results: Program[];
  }>;
}

/**
 * Execute SQL query against production D1 database using wrangler
 */
function executeQuery(sql: string): WranglerResult {
  try {
    // Normalize SQL: remove extra whitespace and newlines
    const normalizedSql = sql.trim().replace(/\s+/g, ' ');
    
    const isWindows = process.platform === 'win32';
    const cwd = join(process.cwd(), 'apps/web');
    
    // Use spawnSync for better Windows compatibility
    const args = [
      'wrangler',
      'd1',
      'execute',
      'omni-cms',
      '--command',
      normalizedSql,
      '--json'
    ];
    
    let result;
    if (isWindows) {
      // On Windows, use cmd.exe with /c flag
      result = spawnSync('npx.cmd', args, {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: process.env,
        shell: false
      });
    } else {
      // On Unix, use npx directly
      result = spawnSync('npx', args, {
        cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
        env: process.env,
        shell: false
      });
    }
    
    if (result.error) {
      throw result.error;
    }
    
    if (result.status !== 0) {
      const errorMsg = result.stderr?.toString() || result.stdout?.toString() || 'Unknown error';
      throw new Error(`Command failed with exit code ${result.status}: ${errorMsg}`);
    }
    
    const output = result.stdout?.toString() || '';
    
    // Handle potential multiple JSON objects or extra output
    const jsonOutput = output.trim();
    // Find the last complete JSON object
    const lastBrace = jsonOutput.lastIndexOf('}');
    if (lastBrace === -1) {
      throw new Error('No valid JSON found in output');
    }
    const jsonString = jsonOutput.substring(0, lastBrace + 1);
    
    return JSON.parse(jsonString) as WranglerResult;
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: Buffer; stderr?: Buffer; output?: Buffer };
    console.error('❌ Error executing query:', err.message || 'Unknown error');
    if (err.stdout) {
      console.error('Stdout:', err.stdout.toString());
    }
    if (err.stderr) {
      console.error('Stderr:', err.stderr.toString());
    }
    if (err.output) {
      console.error('Output:', err.output.toString());
    }
    throw error;
  }
}

/**
 * Format date for display
 */
function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'Not published';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Display programs in a formatted table
 */
function displayPrograms(programs: Program[]) {
  if (programs.length === 0) {
    console.log('\n❌ No programs found for Coventry University.\n');
    return;
  }

  console.log(`\n✅ Found ${programs.length} program(s) from Coventry University:\n`);
  console.log('═'.repeat(100));
  
  programs.forEach((program, index) => {
    console.log(`\n${index + 1}. ${program.title}`);
    console.log(`   Slug: ${program.slug}`);
    if (program.excerpt) {
      const excerpt = program.excerpt.length > 100 
        ? program.excerpt.substring(0, 100) + '...'
        : program.excerpt;
      console.log(`   Excerpt: ${excerpt}`);
    }
    console.log(`   Status: ${program.status}`);
    console.log(`   Published: ${formatDate(program.published_at)}`);
    if (program.organization_slug) {
      console.log(`   Organization: ${program.organization_slug}`);
    }
    console.log(`   ID: ${program.id}`);
  });
  
  console.log('\n' + '═'.repeat(100));
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Fetching programs from Coventry University...\n');

  // Step 1: Find organizations that might contain Coventry University
  console.log('📋 Step 1: Finding organizations...');
  const orgQuery = `
    SELECT DISTINCT o.id, o.slug, o.name
    FROM organizations o
    WHERE o.slug IN ('study-in-kazakhstan', 'study-in-north-cyprus')
    ORDER BY o.slug;
  `;
  
  let orgResult: WranglerResult;
  try {
    orgResult = executeQuery(orgQuery);
  } catch (error) {
    console.error('❌ Failed to query organizations');
    process.exit(1);
  }

  const organizations = orgResult.results[0]?.results || [];
  if (organizations.length === 0) {
    console.log('❌ No organizations found');
    process.exit(1);
  }

  console.log(`   Found ${organizations.length} organization(s)`);

  // Step 2: Find Coventry University post in each organization
  console.log('\n📋 Step 2: Finding Coventry University...');
  const universityQuery = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.organization_id,
      o.slug as organization_slug
    FROM posts p
    INNER JOIN post_types pt ON p.post_type_id = pt.id
    INNER JOIN organizations o ON p.organization_id = o.id
    WHERE pt.slug = 'universities'
      AND (p.title LIKE '%Coventry%' OR p.slug LIKE '%coventry%')
      AND p.status = 'published'
    ORDER BY p.title;
  `;

  let universityResult: WranglerResult;
  try {
    universityResult = executeQuery(universityQuery);
  } catch (error) {
    console.error('❌ Failed to query universities');
    process.exit(1);
  }

  const universities = universityResult.results[0]?.results || [];
  if (universities.length === 0) {
    console.log('❌ No Coventry University found in the database');
    process.exit(1);
  }

  console.log(`   Found ${universities.length} Coventry University entry/entries:`);
  universities.forEach((uni: { title: string; organization_slug: string }) => {
    console.log(`   - ${uni.title} (${uni.organization_slug})`);
  });

  // Step 3: Find programs related to Coventry University
  console.log('\n📋 Step 3: Finding programs related to Coventry University...');
  
  const universityIds = universities.map((u: { id: string }) => `'${u.id}'`).join(',');
  
  const programsQuery = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      p.status,
      p.published_at,
      p.organization_id,
      o.slug as organization_slug
    FROM posts p
    INNER JOIN post_relationships pr ON p.id = pr.from_post_id
    INNER JOIN post_types pt ON p.post_type_id = pt.id
    INNER JOIN organizations o ON p.organization_id = o.id
    WHERE pt.slug = 'programs'
      AND pr.relationship_type = 'university'
      AND pr.to_post_id IN (${universityIds})
      AND p.status = 'published'
    ORDER BY p.title;
  `;

  let programsResult: WranglerResult;
  try {
    programsResult = executeQuery(programsQuery);
  } catch (error) {
    console.error('❌ Failed to query programs');
    process.exit(1);
  }

  const programs = programsResult.results[0]?.results || [];
  
  // Display results
  displayPrograms(programs);

  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Total programs: ${programs.length}`);
  console.log(`   Organizations: ${[...new Set(programs.map(p => p.organization_slug))].join(', ')}`);
  console.log('');
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

