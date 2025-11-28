/**
 * Helper for setting up real D1 database with Miniflare for integration tests
 */

import { Miniflare } from 'miniflare';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { D1Database } from '@cloudflare/workers-types';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Result of creating integration D1 setup
 */
export interface IntegrationD1Setup {
  db: D1Database;
  mf: Miniflare;
}

/**
 * Creates a real D1 database using Miniflare with migrations applied
 * Returns both the database and Miniflare instance for cleanup
 */
export async function createIntegrationD1(): Promise<IntegrationD1Setup> {
  // Create a minimal worker script that Miniflare can use
  const workerScript = `export default {
    async fetch() {
      return new Response('OK');
    }
  }`;

  const mf = new Miniflare({
    script: workerScript,
    modules: true,
    d1Databases: ['DB'],
    // Use a separate database file for tests (isolated from dev database)
    d1Persist: true,
    d1PersistPath: './.wrangler/test-state/d1',
  });

  const d1 = await mf.getD1Database('DB');
  
  // Run migrations to set up schema
  await runMigrations(d1);
  
  return { db: d1, mf };
}

/**
 * Runs all migration files on the D1 database
 */
async function runMigrations(db: D1Database): Promise<void> {
  const migrationsDir = resolve(join(__dirname, '../../../drizzle/migrations'));
  
  if (!existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found: ${migrationsDir}`);
    return;
  }
  
  // Get all SQL migration files sorted by name
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.warn('No migration files found');
    return;
  }

  // Execute each migration
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    // Split by statement-breakpoint and execute each statement
    const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement) {
        try {
          await db.exec(statement);
        } catch (error: any) {
          // Ignore errors for tables that already exist (e.g., if migrations already ran)
          if (!error?.message?.includes('already exists')) {
            console.warn(`Migration error in ${file}:`, error.message);
          }
        }
      }
    }
  }
}

/**
 * Cleans up the Miniflare instance and test database
 */
export async function cleanupIntegrationD1(mf: Miniflare): Promise<void> {
  await mf.dispose();
}
