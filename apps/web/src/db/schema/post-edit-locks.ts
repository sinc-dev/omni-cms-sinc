import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts } from './posts';
import { users } from './users';

export const postEditLocks = sqliteTable(
  'post_edit_locks',
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
    lockedAt: integer('locked_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => {
        // Lock expires after 30 minutes
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 30);
        return expires;
      }),
  },
  (table) => ({
    postIdx: index('idx_post_edit_locks_post').on(table.postId),
    userIdx: index('idx_post_edit_locks_user').on(table.userId),
    expiresIdx: index('idx_post_edit_locks_expires').on(table.expiresAt),
    postUserIdx: index('idx_post_edit_locks_post_user').on(table.postId, table.userId),
  })
);

// Relations
export const postEditLocksRelations = relations(postEditLocks, ({ one }) => ({
  post: one(posts, {
    fields: [postEditLocks.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postEditLocks.userId],
    references: [users.id],
  }),
}));

export type PostEditLock = typeof postEditLocks.$inferSelect;
export type NewPostEditLock = typeof postEditLocks.$inferInsert;

