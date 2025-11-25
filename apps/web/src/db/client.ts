import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// This will be used in API routes with Cloudflare D1 binding
export function getDb(d1: D1Database) {
  if (!d1) {
    throw new Error(
      'Database not configured: D1 binding is missing. ' +
      'Please configure the DB binding in Cloudflare Pages Settings → Functions.'
    );
  }
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof getDb>;

/**
 * Safely gets the database client from Cloudflare bindings
 * Returns null if binding is not available instead of throwing
 */
export function tryGetDb(env?: any): DbClient | null {
  try {
    const d1 = env?.DB || (globalThis as any).DB;
    if (!d1) {
      return null;
    }
    return getDb(d1);
  } catch {
    return null;
  }
}
