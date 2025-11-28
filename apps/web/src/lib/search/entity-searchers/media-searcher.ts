import { eq, and, or, desc, asc, sql, like } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { media } from '@/db/schema/media';
import type { FilterGroup, SortConfig } from '@/lib/validations/search';
import { FilterBuilder } from '../filter-builder';
import { createCursor, decodeCursor } from '../cursor-pagination';

export interface MediaItem {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  url?: string;
  [key: string]: unknown;
}

export interface MediaSearchResult {
  data: MediaItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Searcher for media entity
 */
export class MediaSearcher {
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
  }): Promise<MediaSearchResult> {
    const conditions: SQL[] = [
      eq(media.organizationId, this.organizationId),
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
        like(media.filename, searchTerm),
        like(media.altText, searchTerm),
        like(media.caption, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Handle cursor-based pagination
    if (options.after) {
      const cursorData = decodeCursor(options.after);
      if (cursorData && cursorData.entityType === 'media') {
        const sortConfig = options.sorts?.[0];
        if (sortConfig) {
          const sortColumn = (media as Record<string, SQL>)[sortConfig.property];
          if (sortColumn) {
            if (sortConfig.direction === 'desc') {
              conditions.push(
                or(
                  sql`${sortColumn} < ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${media.id} > ${cursorData.lastId}`
                  )
                )!
              );
            } else {
              conditions.push(
                or(
                  sql`${sortColumn} > ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${media.id} > ${cursorData.lastId}`
                  )
                )!
              );
            }
          }
        } else {
          conditions.push(sql`${media.id} < ${cursorData.lastId}`);
        }
      }
    }

    // Build order by
    const orderBy = options.sorts && options.sorts.length > 0
      ? options.sorts.map(sort => {
          const column = (media as Record<string, SQL>)[sort.property];
          if (!column) return desc(media.createdAt);
          return sort.direction === 'asc' ? asc(column) : desc(column);
        })
      : [desc(media.createdAt)];

    // Select properties
    const selectFields: Record<string, SQL> = {};
    if (options.properties && options.properties.length > 0) {
      for (const prop of options.properties) {
        if (prop.includes('.')) continue;
        const column = (media as Record<string, SQL>)[prop];
        if (column) {
          selectFields[prop] = column;
        }
      }
    } else {
      // Default: all fields
      selectFields.id = media.id;
      selectFields.filename = media.filename;
      selectFields.mimeType = media.mimeType;
      selectFields.fileSize = media.fileSize;
      selectFields.altText = media.altText;
      selectFields.caption = media.caption;
      selectFields.width = media.width;
      selectFields.height = media.height;
      selectFields.createdAt = media.createdAt;
      selectFields.updatedAt = media.updatedAt;
    }

    if (!selectFields.id) {
      selectFields.id = media.id;
    }

    // Execute query
    const results = await this.db
      .select(selectFields)
      .from(media)
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
        'media',
        lastItem.id,
        sortConfig ? (lastItem as Record<string, unknown>)[sortConfig.property] as string | number | undefined : undefined,
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

