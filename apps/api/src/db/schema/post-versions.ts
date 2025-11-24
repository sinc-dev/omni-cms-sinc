import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';
import { users } from './users';

export const postVersions = sqliteTable(
  'post_versions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'), // Rich text HTML
    excerpt: text('excerpt'),
    customFields: text('custom_fields'), // JSON string of custom field values
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_versions_post').on(table.postId),
    versionIdx: index('idx_post_versions_version').on(table.postId, table.versionNumber),
    createdByIdx: index('idx_post_versions_created_by').on(table.createdBy),
  })
);

// Relations
export const postVersionsRelations = relations(postVersions, ({ one }) => ({
  post: one(posts, {
    fields: [postVersions.postId],
    references: [posts.id],
  }),
  creator: one(users, {
    fields: [postVersions.createdBy],
    references: [users.id],
  }),
}));

export type PostVersion = typeof postVersions.$inferSelect;
export type NewPostVersion = typeof postVersions.$inferInsert;

