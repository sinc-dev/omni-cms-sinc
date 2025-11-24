import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { postTypes } from './post-types';
import { customFields } from './custom-fields';

export const postTypeFields = sqliteTable(
  'post_type_fields',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postTypeId: text('post_type_id')
      .notNull()
      .references(() => postTypes.id, { onDelete: 'cascade' }),
    customFieldId: text('custom_field_id')
      .notNull()
      .references(() => customFields.id, { onDelete: 'cascade' }),
    isRequired: integer('is_required', { mode: 'boolean' })
      .notNull()
      .default(false),
    defaultValue: text('default_value'),
    order: integer('order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    typeIdx: index('idx_post_type_fields_type').on(table.postTypeId),
    fieldIdx: index('idx_post_type_fields_field').on(table.customFieldId),
    typeFieldIdx: uniqueIndex('idx_post_type_fields_unique').on(table.postTypeId, table.customFieldId),
  })
);

// Relations
export const postTypeFieldsRelations = relations(postTypeFields, ({ one }) => ({
  postType: one(postTypes, {
    fields: [postTypeFields.postTypeId],
    references: [postTypes.id],
  }),
  customField: one(customFields, {
    fields: [postTypeFields.customFieldId],
    references: [customFields.id],
  }),
}));

export type PostTypeField = typeof postTypeFields.$inferSelect;
export type NewPostTypeField = typeof postTypeFields.$inferInsert;

