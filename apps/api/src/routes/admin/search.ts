import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { searchRequestSchema } from '../../lib/validations/search';
import { SearchOrchestrator } from '../../lib/search/search-orchestrator';
import type { SearchRequest } from '../../lib/validations/search';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/admin/v1/organizations/:orgId/search
// HubSpot-style advanced search with filter groups, property selection, and cursor pagination
app.post(
  '/:orgId/search',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    let searchRequest: SearchRequest;
    try {
      const body = await c.req.json();
      searchRequest = searchRequestSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    try {
      const orchestrator = new SearchOrchestrator(db, organizationId!, undefined);
      const result = await orchestrator.search(searchRequest);

      return c.json(successResponse(result));
    } catch (error) {
      console.error('Search error:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      ), 500);
    }
  }
);

// GET /api/admin/v1/organizations/:orgId/search
// Keep GET endpoint for backward compatibility (simple search)
app.get(
  '/:orgId/search',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = parseInt(url.searchParams.get('per_page') || '20', 10);

    if (!query || query.trim().length === 0) {
      return c.json(Errors.badRequest('Search query is required'), 400);
    }

    // Convert GET params to POST format for compatibility
    const searchRequest: SearchRequest = {
      entityType: 'posts',
      search: query,
      limit: perPage,
      filterGroups: [],
    };

    // Add basic filters from query params
    const postType = url.searchParams.get('post_type');
    const status = url.searchParams.get('status');
    const authorId = url.searchParams.get('author_id');

    if (postType || status || authorId) {
      const filters = [];
      if (postType) {
        filters.push({ property: 'postTypeId', operator: 'eq' as const, value: postType });
      }
      if (status) {
        filters.push({ property: 'status', operator: 'eq' as const, value: status });
      }
      if (authorId) {
        filters.push({ property: 'authorId', operator: 'eq' as const, value: authorId });
      }

      if (filters.length > 0) {
        searchRequest.filterGroups = [{
          operator: 'AND',
          filters,
        }];
      }
    }

    try {
      const orchestrator = new SearchOrchestrator(db, organizationId!, undefined);
      const result = await orchestrator.search(searchRequest);

      // Convert cursor-based to page-based for backward compatibility
      const offset = (page - 1) * perPage;
      const paginatedResults = result.results.slice(offset, offset + perPage);

      return c.json(successResponse({
        results: paginatedResults,
        meta: {
          page,
          perPage,
          total: result.results.length, // Approximate
          totalPages: Math.ceil(result.results.length / perPage),
        },
      }));
    } catch (error) {
      console.error('Search error:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      ), 500);
    }
  }
);

export default app;

