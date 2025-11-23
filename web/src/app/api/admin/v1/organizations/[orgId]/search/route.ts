import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { searchRequestSchema } from '@/lib/validations/search';
import { SearchOrchestrator } from '@/lib/search/search-orchestrator';
import type { SearchRequest } from '@/lib/validations/search';

// POST /api/admin/v1/organizations/:orgId/search
// HubSpot-style advanced search with filter groups, property selection, and cursor pagination
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, searchRequestSchema);
    if (!validation.success) return validation.response;

    const searchRequest: SearchRequest = validation.data;

    try {
      const orchestrator = new SearchOrchestrator(db, organizationId!, undefined);
      const result = await orchestrator.search(searchRequest);

      return successResponse(result);
    } catch (error) {
      console.error('Search error:', error);
      return Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      );
    }
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// Keep GET endpoint for backward compatibility (simple search)
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = parseInt(url.searchParams.get('per_page') || '20', 10);

    if (!query || query.trim().length === 0) {
      return Errors.badRequest('Search query is required');
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

      return successResponse({
        results: paginatedResults,
        meta: {
          page,
          perPage,
          total: result.results.length, // Approximate
          totalPages: Math.ceil(result.results.length / perPage),
        },
      });
    } catch (error) {
      console.error('Search error:', error);
      return Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      );
    }
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);
