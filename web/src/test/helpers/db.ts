import { getDb } from '@/db/client';
import type { DbClient } from '@/db/client';

/**
 * Creates a test database instance
 * Uses Miniflare's D1 implementation for local testing
 */
export function createTestDb(d1: D1Database): DbClient {
  return getDb(d1);
}

/**
 * Cleans up test database by dropping all tables
 */
export async function cleanupTestDb(db: DbClient) {
  // Get all table names and drop them
  // This is a simplified version - in production, you'd want to be more careful
  const tables = [
    'analytics_events',
    'post_analytics',
    'api_keys',
    'content_blocks',
    'post_content_blocks',
    'post_edit_locks',
    'post_versions',
    'presence',
    'post_templates',
    'webhooks',
    'webhook_logs',
    'workflow_comments',
    'workflow_assignments',
    'post_taxonomies',
    'taxonomy_terms',
    'taxonomies',
    'post_relationships',
    'post_field_values',
    'posts',
    'custom_fields',
    'post_types',
    'media',
    'users_organizations',
    'roles',
    'organizations',
    'users',
  ];

  // Note: This function is not used in the current test setup
  // Data cleanup is handled in beforeEach in setup.ts
  // Keeping this for potential future use
}

/**
 * Seeds test database with minimal data for testing
 */
export async function seedTestDb(db: DbClient) {
  // This will be implemented based on your seed data needs
  // For now, it's a placeholder
}

