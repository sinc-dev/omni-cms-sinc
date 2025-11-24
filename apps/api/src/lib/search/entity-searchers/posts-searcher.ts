import type { DbClient } from '@/db/client';
import { QueryBuilder, type QueryBuilderOptions } from '../query-builder';

/**
 * Searcher for posts entity
 */
export class PostsSearcher {
  private db: DbClient;
  private organizationId: string;

  constructor(db: DbClient, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  async search(options: Omit<QueryBuilderOptions, 'organizationId' | 'entityType'>) {
    const queryBuilder = new QueryBuilder(this.db, {
      ...options,
      organizationId: this.organizationId,
      entityType: 'posts',
    });

    return queryBuilder.searchPosts();
  }
}

