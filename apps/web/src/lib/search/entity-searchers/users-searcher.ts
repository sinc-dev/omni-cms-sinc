import { eq, and, or, desc, asc, sql, like } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { users } from '@/db/schema/users';
import type { FilterGroup, SortConfig } from '@/lib/validations/search';
import { FilterBuilder } from '../filter-builder';
import { createCursor, decodeCursor } from '../cursor-pagination';

export interface UserItem {
  id: string;
  email: string;
  name: string;
  [key: string]: unknown;
}

export interface UsersSearchResult {
  data: UserItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Searcher for users entity
 */
export class UsersSearcher {
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
  }): Promise<UsersSearchResult> {
    const conditions: SQL[] = [];

    // Note: Users are global, not organization-scoped
    // But we can filter by organization membership if needed

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
        like(users.name, searchTerm),
        like(users.email, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Handle cursor-based pagination
    if (options.after) {
      const cursorData = decodeCursor(options.after);
      if (cursorData && cursorData.entityType === 'users') {
        const sortConfig = options.sorts?.[0];
        if (sortConfig) {
          const sortColumn = (users as Record<string, SQL>)[sortConfig.property];
          if (sortColumn) {
            if (sortConfig.direction === 'desc') {
              conditions.push(
                or(
                  sql`${sortColumn} < ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${users.id} > ${cursorData.lastId}`
                  )
                )!
              );
            } else {
              conditions.push(
                or(
                  sql`${sortColumn} > ${cursorData.sortValue}`,
                  and(
                    sql`${sortColumn} = ${cursorData.sortValue}`,
                    sql`${users.id} > ${cursorData.lastId}`
                  )
                )!
              );
            }
          }
        } else {
          conditions.push(sql`${users.id} < ${cursorData.lastId}`);
        }
      }
    }

    // Build order by
    const orderBy = options.sorts && options.sorts.length > 0
      ? options.sorts.map(sort => {
          const column = (users as Record<string, SQL>)[sort.property];
          if (!column) return desc(users.createdAt);
          return sort.direction === 'asc' ? asc(column) : desc(column);
        })
      : [desc(users.createdAt)];

    // Select properties
    const selectFields: Record<string, any> = {};
    if (options.properties && options.properties.length > 0) {
      for (const prop of options.properties) {
        if (prop.includes('.')) continue;
        const column = (users as Record<string, SQL>)[prop];
        if (column) {
          selectFields[prop] = column;
        }
      }
    } else {
      // Default: all fields
      selectFields.id = users.id;
      selectFields.name = users.name;
      selectFields.email = users.email;
      selectFields.avatarUrl = users.avatarUrl;
      selectFields.isSuperAdmin = users.isSuperAdmin;
      selectFields.createdAt = users.createdAt;
      selectFields.updatedAt = users.updatedAt;
    }

    if (!selectFields.id) {
      selectFields.id = users.id;
    }

    // Execute query
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await this.db
      .select(selectFields)
      .from(users)
      .where(whereClause)
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
        'users',
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

