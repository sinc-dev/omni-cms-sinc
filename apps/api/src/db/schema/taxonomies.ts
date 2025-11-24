import { sqliteTable, text, integer, index, uniqueIndex, type SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { relations, type Relations } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { organizations } from './organizations';
import { posts } from './posts';

export const taxonomies = sqliteTable(
  'taxonomies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    isHierarchical: integer('is_hierarchical', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_taxonomies_org').on(table.organizationId),
    orgSlugIdx: uniqueIndex('idx_taxonomies_org_slug').on(table.organizationId, table.slug),
    // Composite index for organization lookups
  })
);

export const taxonomyTerms = sqliteTable(
  'taxonomy_terms',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    taxonomyId: text('taxonomy_id')
      .notNull()
      .references(() => taxonomies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    parentId: text('parent_id').references((): any => taxonomyTerms.id),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    taxonomyIdx: index('idx_taxonomy_terms_taxonomy').on(table.taxonomyId),
    parentIdx: index('idx_taxonomy_terms_parent').on(table.parentId),
    taxonomySlugIdx: uniqueIndex('idx_taxonomy_terms_taxonomy_slug').on(
      table.taxonomyId,
      table.slug
    ),
  })
);

export const postTaxonomies = sqliteTable(
  'post_taxonomies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    taxonomyTermId: text('taxonomy_term_id')
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    postIdx: index('idx_post_taxonomies_post').on(table.postId),
    termIdx: index('idx_post_taxonomies_term').on(table.taxonomyTermId),
    postTermIdx: uniqueIndex('idx_post_taxonomies_unique').on(table.postId, table.taxonomyTermId),
  })
);

// Relations
export const taxonomiesRelations = relations(taxonomies, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [taxonomies.organizationId],
    references: [organizations.id],
  }),
  terms: many(taxonomyTerms),
}));

export const taxonomyTermsRelations = relations(taxonomyTerms, ({ one, many }) => ({
  taxonomy: one(taxonomies, {
    fields: [taxonomyTerms.taxonomyId],
    references: [taxonomies.id],
  }),
  parent: one(taxonomyTerms, {
    fields: [taxonomyTerms.parentId],
    references: [taxonomyTerms.id],
  }),
  children: many(taxonomyTerms),
}));

export type Taxonomy = typeof taxonomies.$inferSelect;
export type NewTaxonomy = typeof taxonomies.$inferInsert;
export type TaxonomyTerm = typeof taxonomyTerms.$inferSelect;
export type NewTaxonomyTerm = typeof taxonomyTerms.$inferInsert;
export type PostTaxonomy = typeof postTaxonomies.$inferSelect;
export type NewPostTaxonomy = typeof postTaxonomies.$inferInsert;
