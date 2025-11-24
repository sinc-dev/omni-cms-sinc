import { eq, and, or, desc, asc, sql, like } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { taxonomies, taxonomyTerms } from '@/db/schema/taxonomies';
import type { FilterGroup, SortConfig } from '@/lib/validations/search';
import { FilterBuilder } from '../filter-builder';
import { createCursor, decodeCursor } from '../cursor-pagination';

export interface TaxonomiesSearchResult {
  data: any[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Searcher for taxonomies entity
 */
export class TaxonomiesSearcher {
  private db: DbClient;
  private organizationId: string;

  constructor(db: DbClient, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  async search(options: {
    filterGroups?: FilterGroup[];
    search?: string;
    sorts?: SortConfig[];
    properties?: string[];
    limit: number;
    after?: string;
  }): Promise<TaxonomiesSearchResult> {
    const conditions: any[] = [
      eq(taxonomies.organizationId, this.organizationId),
    ];

    // Add filter groups
    if (options.filterGroups && options.filterGroups.length > 0) {
      const filterBuilder = new FilterBuilder(this.db, this.organizationId);
      const filterConditions = await filterBuilder.buildConditions(options.filterGroups);
      conditions.push(...filterConditions);
    }

    // Add full-text search
    if (options.search) {
      const searchTerm = `%${options.search}%`;
      const searchCondition = or(
        like(taxonomies.name, searchTerm),
        like(taxonomies.slug, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Handle cursor-based pagination
    if (options.after) {
      const cursorData = decodeCursor(options.after);
      if (cursorData && cursorData.entityType === 'taxonomies') {
        const sortConfig = options.sorts?.[0];
        if (sortConfig) {
          const sortColumn = (taxonomies as any)[sortConfig.property];
          if (sortColumn) {
            if (sortConfig.direction === 'desc') {
              conditions.push(
                or(
                  sql`${sortColumn} < ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${taxonomies.id} > ${cursorData.lastId}`
                  )
                )!
              );
            } else {
              conditions.push(
                or(
                  sql`${sortColumn} > ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${taxonomies.id} > ${cursorData.lastId}`
                  )
                )!
              );
            }
          }
        } else {
          conditions.push(sql`${taxonomies.id} < ${cursorData.lastId}`);
        }
      }
    }

    // Build order by
    const orderBy = options.sorts && options.sorts.length > 0
      ? options.sorts.map(sort => {
          const column = (taxonomies as any)[sort.property];
          if (!column) return desc(taxonomies.createdAt);
          return sort.direction === 'asc' ? asc(column) : desc(column);
        })
      : [desc(taxonomies.createdAt)];

    // Select properties
    const selectFields: Record<string, any> = {};
    if (options.properties && options.properties.length > 0) {
      for (const prop of options.properties) {
        if (prop.includes('.')) continue;
        const column = (taxonomies as any)[prop];
        if (column) {
          selectFields[prop] = column;
        }
      }
    } else {
      // Default: all fields
      selectFields.id = taxonomies.id;
      selectFields.name = taxonomies.name;
      selectFields.slug = taxonomies.slug;
      selectFields.isHierarchical = taxonomies.isHierarchical;
      selectFields.createdAt = taxonomies.createdAt;
      selectFields.updatedAt = taxonomies.updatedAt;
    }

    if (!selectFields.id) {
      selectFields.id = taxonomies.id;
    }

    // Execute query
    const results = await this.db
      .select(selectFields)
      .from(taxonomies)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(options.limit + 1);

    const hasMore = results.length > options.limit;
    const data = hasMore ? results.slice(0, options.limit) : results;

    // Create next cursor
    let nextCursor: string | undefined;
    if (hasMore && data.length > 0) {
      const lastItem = data[data.length - 1];
      const sortConfig = options.sorts?.[0];
      nextCursor = createCursor(
        'taxonomies',
        lastItem.id,
        sortConfig ? (lastItem as any)[sortConfig.property] : undefined,
        sortConfig?.property
      );
    }

    return {
      data,
      nextCursor,
      hasMore,
    };
  }
}

