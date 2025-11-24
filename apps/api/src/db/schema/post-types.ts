import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';

export const postTypes = sqliteTable(
  'post_types',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    icon: text('icon'),
    isHierarchical: integer('is_hierarchical', { mode: 'boolean' })
      .notNull()
      .default(false),
    settings: text('settings'), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_post_types_org').on(table.organizationId),
    orgSlugIdx: uniqueIndex('idx_post_types_org_slug').on(table.organizationId, table.slug),
  })
);

// Relations
export const postTypesRelations = relations(postTypes, ({ one }) => ({
  organization: one(organizations, {
    fields: [postTypes.organizationId],
    references: [organizations.id],
  }),
}));

export type PostType = typeof postTypes.$inferSelect;
export type NewPostType = typeof postTypes.$inferInsert;
