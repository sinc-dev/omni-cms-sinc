import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';

export const postShares = sqliteTable(
  'post_shares',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    shareType: text('share_type').notNull(), // facebook, twitter, email, link, etc.
    metadata: text('metadata'), // JSON for additional share data
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_shares_post').on(table.postId),
    typeIdx: index('idx_post_shares_type').on(table.shareType),
    createdAtIdx: index('idx_post_shares_created').on(table.createdAt),
  })
);

// Relations
export const postSharesRelations = relations(postShares, ({ one }) => ({
  post: one(posts, {
    fields: [postShares.postId],
    references: [posts.id],
  }),
}));

export type PostShare = typeof postShares.$inferSelect;
export type NewPostShare = typeof postShares.$inferInsert;

