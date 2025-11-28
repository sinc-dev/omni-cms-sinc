import type { DbClient } from '@/db/client';
import type { SearchRequest } from '@/lib/validations/search';
import { PostsSearcher } from './entity-searchers/posts-searcher';
import { MediaSearcher } from './entity-searchers/media-searcher';
import { UsersSearcher } from './entity-searchers/users-searcher';
import { TaxonomiesSearcher } from './entity-searchers/taxonomies-searcher';
import { hasScope } from '@/lib/api/api-keys';
import { eq, and } from 'drizzle-orm';
import { posts } from '@/db/schema/posts';

export interface SearchResult {
  results: Array<Record<string, unknown>>;
  entityType: string;
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Orchestrates multi-entity searches
 */
export class SearchOrchestrator {
  private db: DbClient;
  private organizationId: string;
  private apiKeyScopes?: string[];

  constructor(db: DbClient, organizationId: string, apiKeyScopes?: string[]) {
    this.db = db;
    this.organizationId = organizationId;
    this.apiKeyScopes = apiKeyScopes;
  }

  async search(request: SearchRequest): Promise<SearchResult> {
    // Apply scope-based filtering
    const searchOptions = {
      filterGroups: this.applyScopeFilters(request.filterGroups),
      search: request.search,
      sorts: request.sorts,
      properties: request.properties,
      limit: request.limit,
      after: request.after,
    };

    switch (request.entityType) {
      case 'posts':
        const postsSearcher = new PostsSearcher(this.db, this.organizationId);
        const postsResult = await postsSearcher.search(searchOptions);
        
        // Filter results based on scope
        let filteredResults = postsResult.data;
        if (this.apiKeyScopes) {
          if (hasScope(this.apiKeyScopes, 'posts:read:published')) {
            // Only return published posts
            filteredResults = filteredResults.filter((post: Record<string, unknown>) => post.status === 'published');
          } else if (!hasScope(this.apiKeyScopes, 'posts:read')) {
            // No read permission, return empty
            filteredResults = [];
          }
        }
        
        return {
          results: filteredResults,
          entityType: 'posts',
          pagination: {
            limit: request.limit,
            hasMore: postsResult.hasMore,
            nextCursor: postsResult.nextCursor,
          },
        };

      case 'media':
        const mediaSearcher = new MediaSearcher(this.db, this.organizationId);
        const mediaResult = await mediaSearcher.search(searchOptions);
        return {
          results: mediaResult.data,
          entityType: 'media',
          pagination: {
            limit: request.limit,
            hasMore: mediaResult.hasMore,
            nextCursor: mediaResult.nextCursor,
          },
        };

      case 'users':
        const usersSearcher = new UsersSearcher(this.db, this.organizationId);
        const usersResult = await usersSearcher.search(searchOptions);
        return {
          results: usersResult.data,
          entityType: 'users',
          pagination: {
            limit: request.limit,
            hasMore: usersResult.hasMore,
            nextCursor: usersResult.nextCursor,
          },
        };

      case 'taxonomies':
        const taxonomiesSearcher = new TaxonomiesSearcher(this.db, this.organizationId);
        const taxonomiesResult = await taxonomiesSearcher.search(searchOptions);
        return {
          results: taxonomiesResult.data,
          entityType: 'taxonomies',
          pagination: {
            limit: request.limit,
            hasMore: taxonomiesResult.hasMore,
            nextCursor: taxonomiesResult.nextCursor,
          },
        };

      case 'all':
        // Search across all entities and combine results
        // For now, we'll search posts only (can be enhanced later)
        const allPostsSearcher = new PostsSearcher(this.db, this.organizationId);
        const allPostsResult = await allPostsSearcher.search(searchOptions);
        return {
          results: allPostsResult.data,
          entityType: 'all',
          pagination: {
            limit: request.limit,
            hasMore: allPostsResult.hasMore,
            nextCursor: allPostsResult.nextCursor,
          },
        };

      default:
        throw new Error(`Unsupported entity type: ${request.entityType}`);
    }
  }

  /**
   * Apply scope-based filters to filter groups
   */
  private applyScopeFilters(
    filterGroups?: SearchRequest['filterGroups']
  ): SearchRequest['filterGroups'] {
    if (!this.apiKeyScopes || !filterGroups) {
      return filterGroups;
    }

    // If scope is posts:read:published, ensure status filter is set to published
    if (hasScope(this.apiKeyScopes, 'posts:read:published') && !hasScope(this.apiKeyScopes, 'posts:read')) {
      // Add status filter to ensure only published posts
      const statusFilter = {
        property: 'status',
        operator: 'eq' as const,
        value: 'published',
      };

      // Add to first filter group or create new one
      if (filterGroups.length > 0) {
        filterGroups[0].filters.push(statusFilter);
      } else {
        filterGroups = [{
          operator: 'AND',
          filters: [statusFilter],
        }];
      }
    }

    return filterGroups;
  }
}

