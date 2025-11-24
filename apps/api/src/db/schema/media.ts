import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';
import { users } from './users';

export const media = sqliteTable(
  'media',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    uploaderId: text('uploader_id')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    fileKey: text('file_key').notNull(), // R2 storage key
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(), // bytes
    width: integer('width'), // for images
    height: integer('height'), // for images
    altText: text('alt_text'),
    caption: text('caption'),
    metadata: text('metadata'), // JSON for additional metadata
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_media_org').on(table.organizationId),
    uploaderIdx: index('idx_media_uploader').on(table.uploaderId),
    typeIdx: index('idx_media_type').on(table.mimeType),
  })
);

// Relations
export const mediaRelations = relations(media, ({ one }) => ({
  organization: one(organizations, {
    fields: [media.organizationId],
    references: [organizations.id],
  }),
  uploader: one(users, {
    fields: [media.uploaderId],
    references: [users.id],
  }),
}));

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
