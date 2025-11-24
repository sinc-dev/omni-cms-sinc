import { beforeAll, afterAll, beforeEach } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getDb } from '@/db/client';
import type { DbClient } from '@/db/client';

// Global test database instance
let mf: Miniflare;
let testDb: DbClient;
let d1Database: D1Database;

beforeAll(async () => {
  // Initialize Miniflare with D1 support
  mf = new Miniflare({
    modules: true,
    script: '',
    d1Databases: ['DB'],
  });

  // Get D1 database binding
  d1Database = await mf.getD1Database('DB');
  testDb = getDb(d1Database);

  // Run migrations by reading the SQL file
  const migrationPath = join(process.cwd(), 'drizzle', 'migrations', '0000_loving_stick.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Split by statement breakpoint and execute each statement
  const statements = migrationSQL.split('--> statement-breakpoint').filter((s) => s.trim());
  for (const statement of statements) {
    const cleanStatement = statement.trim();
    if (cleanStatement) {
      try {
        await d1Database.exec(cleanStatement);
      } catch (error) {
        // Some statements might fail (like CREATE INDEX IF NOT EXISTS)
        // This is okay for testing
        console.warn('Migration statement warning:', error);
      }
    }
  }
});

beforeEach(async () => {
  // Clean up data between tests (but keep schema)
  // This is faster than recreating the database
  const tables = [
    'analytics_events', 'post_analytics', 'api_keys', 'content_blocks',
    'post_content_blocks', 'post_edit_locks', 'post_versions', 'presence',
    'post_templates', 'webhooks', 'webhook_logs', 'workflow_comments',
    'workflow_assignments', 'post_taxonomies', 'taxonomy_terms', 'taxonomies',
    'post_relationships', 'post_field_values', 'posts', 'custom_fields',
    'post_types', 'media', 'users_organizations', 'roles', 'organizations', 'users',
  ];

  for (const table of tables) {
    try {
      await d1Database.exec(`DELETE FROM ${table}`);
    } catch (error) {
      // Ignore errors for tables that don't exist yet
    }
  }
});

afterAll(async () => {
  // Cleanup Miniflare instance
  await mf.dispose();
});

export { testDb, d1Database };

