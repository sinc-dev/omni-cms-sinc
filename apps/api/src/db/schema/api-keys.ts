import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g., "Production Website"
    key: text('key').notNull(), // hashed API key
    keyPrefix: text('key_prefix').notNull(), // first 8 chars for identification
    scopes: text('scopes'), // JSON array of permission strings
    rateLimit: integer('rate_limit').notNull().default(10000), // requests per hour
    revokedAt: integer('revoked_at', { mode: 'timestamp' }), // When key was revoked/rotated
    rotatedFromId: text('rotated_from_id'), // ID of key this was rotated from
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }), // null = never expires
  },
  (table) => ({
    orgIdx: index('idx_api_keys_org').on(table.organizationId),
    keyIdx: index('idx_api_keys_key').on(table.key),
  })
);

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
}));

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

