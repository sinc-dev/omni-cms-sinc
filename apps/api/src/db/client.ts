import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// This will be used in API routes with Cloudflare D1 binding
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
