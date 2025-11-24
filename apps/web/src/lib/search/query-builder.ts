import { eq, and, or, desc, asc, sql, SQL } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { posts, postFieldValues, customFields } from '@/db/schema';
import type { SortConfig } from '@/lib/validations/search';
import { FilterBuilder } from './filter-builder';
import type { FilterGroup } from '@/lib/validations/search';

export interface QueryBuilderOptions {
  organizationId: string;
  entityType: 'posts' | 'media' | 'users' | 'taxonomies' | 'all';
  filterGroups?: FilterGroup[];
  search?: string;
  sorts?: SortConfig[];
  properties?: string[];
  limit: number;
  after?: string;
}

export interface QueryResult<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Builds and executes search queries
 */
export class QueryBuilder {
  private db: DbClient;
  private options: QueryBuilderOptions;
  private filterBuilder: FilterBuilder;

  constructor(db: DbClient, options: QueryBuilderOptions) {
    this.db = db;
    this.options = options;
    this.filterBuilder = new FilterBuilder(db, options.organizationId);
  }

  /**
   * Execute search query for posts
   */
  async searchPosts(): Promise<QueryResult<any>> {
    const conditions: SQL<unknown>[] = [
      eq(posts.organizationId, this.options.organizationId),
    ];

    // Add filter groups
    if (this.options.filterGroups && this.options.filterGroups.length > 0) {
      const filterConditions = await this.filterBuilder.buildConditions(this.options.filterGroups);
      conditions.push(...filterConditions);
    }

    // Add full-text search
    if (this.options.search) {
      const searchTerm = `%${this.options.search}%`;
      const searchCondition = or(
        sql`${posts.title} LIKE ${searchTerm}`,
        sql`${posts.content} LIKE ${searchTerm}`,
        sql`${posts.excerpt} LIKE ${searchTerm}`
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Handle cursor-based pagination
    if (this.options.after) {
      // Decode cursor and add condition
      const cursorData = this.decodeCursor(this.options.after);
      if (cursorData && cursorData.entityType === 'posts') {
        // Add cursor condition based on sort
        const sortConfig = this.options.sorts?.[0];
        if (sortConfig) {
          const sortColumn = (posts as any)[sortConfig.property];
          if (sortColumn) {
            if (sortConfig.direction === 'desc') {
              conditions.push(
                or(
                  sql`${sortColumn} < ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${posts.id} > ${cursorData.lastId}`
                  )
                )!
              );
            } else {
              conditions.push(
                or(
                  sql`${sortColumn} > ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${posts.id} > ${cursorData.lastId}`
                  )
                )!
              );
            }
          }
        } else {
          // Default: sort by id descending
          conditions.push(sql`${posts.id} < ${cursorData.lastId}`);
        }
      }
    }

    // Build order by
    const orderBy = this.buildOrderBy();

    // Select properties
    const selectFields = this.buildSelectFields();

    // Execute query
    const results = await this.db
      .select(selectFields)
      .from(posts)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(this.options.limit + 1); // Fetch one extra to check if there's more

    const hasMore = results.length > this.options.limit;
    const data = hasMore ? results.slice(0, this.options.limit) : results;

    // Create next cursor
    let nextCursor: string | undefined;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      const sortConfig = this.options.sorts?.[0];
      nextCursor = this.encodeCursor({
        entityType: 'posts',
        lastId: lastItem.id,
        sortValue: sortConfig ? (lastItem as any)[sortConfig.property] : undefined,
        sortProperty: sortConfig?.property,
      });
    }

    // Enhance results with relations if properties are requested
    const enhancedData = await this.enhanceResults(data);

    return {
      data: enhancedData,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Build select fields based on properties
   */
  private buildSelectFields() {
    if (!this.options.properties || this.options.properties.length === 0) {
      // Return all standard fields
      return {
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        status: posts.status,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
        authorId: posts.authorId,
        postTypeId: posts.postTypeId,
        organizationId: posts.organizationId,
      };
    }

    // Select only requested properties
    const selectFields: Record<string, any> = {};
    for (const prop of this.options.properties) {
      // Handle nested properties (e.g., author.name) - we'll fetch these in enhanceResults
      if (prop.includes('.')) {
        continue;
      }

      const column = (posts as any)[prop];
      if (column) {
        selectFields[prop] = column;
      }
    }

    // Always include id for cursor pagination
    if (!selectFields.id) {
      selectFields.id = posts.id;
    }

    return selectFields;
  }

  /**
   * Build order by clause
   */
  private buildOrderBy() {
    if (!this.options.sorts || this.options.sorts.length === 0) {
      return [desc(posts.createdAt)];
    }

    return this.options.sorts.map(sort => {
      const column = (posts as any)[sort.property];
      if (!column) {
        return desc(posts.createdAt); // Fallback
      }
      return sort.direction === 'asc' ? asc(column) : desc(column);
    });
  }

  /**
   * Enhance results with relations and custom fields
   */
  private async enhanceResults(results: any[]): Promise<any[]> {
    if (results.length === 0) return results;

    const enhanced = await Promise.all(
      results.map(async (item) => {
        const enhanced: any = { ...item };

        // Fetch relations if properties are requested
        if (this.options.properties) {
          // Check if we need author info
          if (this.options.properties.some(p => p.startsWith('author.'))) {
            const post = await this.db.query.posts.findFirst({
              where: eq(posts.id, item.id),
              with: {
                author: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            });
            if (post?.author) {
              enhanced.author = post.author;
            }
          }

          // Check if we need post type info
          if (this.options.properties.some(p => p.startsWith('postType.'))) {
            const post = await this.db.query.posts.findFirst({
              where: eq(posts.id, item.id),
              with: {
                postType: {
                  columns: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            });
            if (post?.postType) {
              enhanced.postType = post.postType;
            }
          }

          // Check if we need custom fields
          if (this.options.properties.some(p => p.startsWith('customFields.'))) {
            const customFieldProps = this.options.properties
              .filter(p => p.startsWith('customFields.'))
              .map(p => p.replace('customFields.', ''));

            const fieldValues = await this.db.select().from(postFieldValues)
              .where(eq(postFieldValues.postId, item.id));

            const customFieldsData: Record<string, any> = {};
            for (const fieldSlug of customFieldProps) {
              const customField = await this.db.query.customFields.findFirst({
                where: (fields, { eq, and: andFn }) => andFn(
                  eq(fields.slug, fieldSlug),
                  eq(fields.organizationId, this.options.organizationId)
                ),
              });

              if (customField) {
                const fieldValue = fieldValues.find(fv => fv.customFieldId === customField.id);
                if (fieldValue && fieldValue.value !== null && fieldValue.value !== undefined) {
                  // Parse value based on field type
                  try {
                    if (['number', 'boolean', 'select', 'multi_select', 'json'].includes(customField.fieldType)) {
                      customFieldsData[fieldSlug] = JSON.parse(fieldValue.value as string);
                    } else {
                      customFieldsData[fieldSlug] = fieldValue.value;
                    }
                  } catch {
                    customFieldsData[fieldSlug] = fieldValue.value;
                  }
                }
              }
            }

            if (Object.keys(customFieldsData).length > 0) {
              enhanced.customFields = customFieldsData;
            }
          }
        } else {
          // If no properties specified, include all standard relations
          const post = await this.db.query.posts.findFirst({
            where: eq(posts.id, item.id),
            with: {
              author: true,
              postType: true,
            },
          });
          if (post) {
            enhanced.author = post.author;
            enhanced.postType = post.postType;
          }
        }

        return enhanced;
      })
    );

    return enhanced;
  }

  /**
   * Encode cursor
   */
  private encodeCursor(data: { entityType: string; lastId: string; sortValue?: any; sortProperty?: string }): string {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64');
  }

  /**
   * Decode cursor
   */
  private decodeCursor(cursor: string): { entityType: string; lastId: string; sortValue?: any; sortProperty?: string } | null {
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}

