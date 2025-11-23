import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';

export const customFields = sqliteTable(
  'custom_fields',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    fieldType: text('field_type').notNull(), // text, textarea, rich_text, number, boolean, date, datetime, media, relation, select, multi_select, json
    settings: text('settings'), // JSON string for field-specific configuration
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_custom_fields_org').on(table.organizationId),
    orgSlugIdx: uniqueIndex('idx_custom_fields_org_slug').on(table.organizationId, table.slug),
  })
);

// Relations
export const customFieldsRelations = relations(customFields, ({ one }) => ({
  organization: one(organizations, {
    fields: [customFields.organizationId],
    references: [organizations.id],
  }),
}));

export type CustomField = typeof customFields.$inferSelect;
export type NewCustomField = typeof customFields.$inferInsert;
