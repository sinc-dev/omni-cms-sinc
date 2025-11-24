import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';
import { postTypes } from './post-types';
import { users } from './users';

export const posts = sqliteTable(
  'posts',
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
    authorId: text('author_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content'), // Rich text HTML
    excerpt: text('excerpt'),
    status: text('status').notNull().default('draft'), // draft, published, archived
    workflowStatus: text('workflow_status').default('draft'), // draft, pending_review, approved, rejected
    parentId: text('parent_id').references((): any => posts.id),
    featuredImageId: text('featured_image_id'), // Will reference media table
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    scheduledPublishAt: integer('scheduled_publish_at', { mode: 'timestamp' }), // For scheduled publishing
    // SEO fields
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords'),
    ogImageId: text('og_image_id'), // References media table
    canonicalUrl: text('canonical_url'),
    structuredData: text('structured_data'), // JSON string for schema markup
    shareCount: integer('share_count').notNull().default(0), // Number of times post was shared
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_posts_org').on(table.organizationId),
    typeIdx: index('idx_posts_type').on(table.postTypeId),
    authorIdx: index('idx_posts_author').on(table.authorId),
    statusIdx: index('idx_posts_status').on(table.status),
    parentIdx: index('idx_posts_parent').on(table.parentId),
    // Composite indexes for common query patterns
    orgStatusIdx: index('idx_posts_org_status').on(table.organizationId, table.status),
    orgTypeIdx: index('idx_posts_org_type').on(table.organizationId, table.postTypeId),
    orgTypeStatusIdx: index('idx_posts_org_type_status').on(
      table.organizationId,
      table.postTypeId,
      table.status
    ),
    publishedIdx: index('idx_posts_published').on(table.organizationId, table.status, table.publishedAt),
    orgTypeSlugIdx: uniqueIndex('idx_posts_org_type_slug').on(
      table.organizationId,
      table.postTypeId,
      table.slug
    ),
  })
);

// Post field values (custom fields)
export const postFieldValues = sqliteTable(
  'post_field_values',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    customFieldId: text('custom_field_id').notNull(),
    value: text('value'), // JSON for complex types
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_field_values_post').on(table.postId),
    fieldIdx: index('idx_post_field_values_field').on(table.customFieldId),
    postFieldIdx: uniqueIndex('idx_post_field_values_unique').on(table.postId, table.customFieldId),
  })
);

// Post relationships
export const postRelationships = sqliteTable(
  'post_relationships',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    fromPostId: text('from_post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    toPostId: text('to_post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    relationshipType: text('relationship_type').notNull(), // related, reference, prerequisite, etc.
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    fromIdx: index('idx_post_relationships_from').on(table.fromPostId),
    toIdx: index('idx_post_relationships_to').on(table.toPostId),
    typeIdx: index('idx_post_relationships_type').on(table.relationshipType),
  })
);

// Relations
export const postsRelations = relations(posts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [posts.organizationId],
    references: [organizations.id],
  }),
  postType: one(postTypes, {
    fields: [posts.postTypeId],
    references: [postTypes.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  parent: one(posts, {
    fields: [posts.parentId],
    references: [posts.id],
  }),
  fieldValues: many(postFieldValues),
  relationshipsFrom: many(postRelationships),
}));

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostFieldValue = typeof postFieldValues.$inferSelect;
export type NewPostFieldValue = typeof postFieldValues.$inferInsert;
export type PostRelationship = typeof postRelationships.$inferSelect;
export type NewPostRelationship = typeof postRelationships.$inferInsert;
