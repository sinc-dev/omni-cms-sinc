import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';
import { users } from './users';

export const presence = sqliteTable(
  'presence',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_presence_post').on(table.postId),
    userIdx: index('idx_presence_user').on(table.userId),
    postUserIdx: uniqueIndex('idx_presence_post_user').on(table.postId, table.userId),
  })
);

// Relations
export const presenceRelations = relations(presence, ({ one }) => ({
  post: one(posts, {
    fields: [presence.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [presence.userId],
    references: [users.id],
  }),
}));

export type Presence = typeof presence.$inferSelect;
export type NewPresence = typeof presence.$inferInsert;

