import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';
import { posts } from './posts';

export const contentBlocks = sqliteTable(
  'content_blocks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    blockType: text('block_type').notNull(), // text, image, video, gallery, cta, code, embed
    content: text('content').notNull(), // JSON string
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_content_blocks_org').on(table.organizationId),
    typeIdx: index('idx_content_blocks_type').on(table.blockType),
    orgSlugIdx: index('idx_content_blocks_org_slug').on(table.organizationId, table.slug),
  })
);

// Junction table for posts and content blocks
export const postContentBlocks = sqliteTable(
  'post_content_blocks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    blockId: text('block_id')
      .notNull()
      .references(() => contentBlocks.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_content_blocks_post').on(table.postId),
    blockIdx: index('idx_post_content_blocks_block').on(table.blockId),
    postOrderIdx: index('idx_post_content_blocks_post_order').on(table.postId, table.order),
  })
);

// Relations
export const contentBlocksRelations = relations(contentBlocks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contentBlocks.organizationId],
    references: [organizations.id],
  }),
  postBlocks: many(postContentBlocks),
}));

export const postContentBlocksRelations = relations(postContentBlocks, ({ one }) => ({
  post: one(posts, {
    fields: [postContentBlocks.postId],
    references: [posts.id],
  }),
  block: one(contentBlocks, {
    fields: [postContentBlocks.blockId],
    references: [contentBlocks.id],
  }),
}));

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type NewContentBlock = typeof contentBlocks.$inferInsert;
export type PostContentBlock = typeof postContentBlocks.$inferSelect;
export type NewPostContentBlock = typeof postContentBlocks.$inferInsert;

