import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';
import { postTypes } from './post-types';

export const postTemplates = sqliteTable(
  'post_templates',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    postTypeId: text('post_type_id')
      .notNull()
      .references(() => postTypes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    content: text('content').notNull(), // JSON string with post data
    customFields: text('custom_fields'), // JSON string with custom field values
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_post_templates_org').on(table.organizationId),
    typeIdx: index('idx_post_templates_type').on(table.postTypeId),
    orgSlugIdx: index('idx_post_templates_org_slug').on(table.organizationId, table.slug),
  })
);

// Relations
export const postTemplatesRelations = relations(postTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [postTemplates.organizationId],
    references: [organizations.id],
  }),
  postType: one(postTypes, {
    fields: [postTemplates.postTypeId],
    references: [postTypes.id],
  }),
}));

export type PostTemplate = typeof postTemplates.$inferSelect;
export type NewPostTemplate = typeof postTemplates.$inferInsert;

