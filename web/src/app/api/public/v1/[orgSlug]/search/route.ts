import { withPublic, trackApiEvent } from '@/lib/api/public-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { searchRequestSchema } from '@/lib/validations/search';
import { SearchOrchestrator } from '@/lib/search/search-orchestrator';
import type { SearchRequest } from '@/lib/validations/search';

export const runtime = 'edge';

// POST /api/public/v1/:orgSlug/search
// HubSpot-style advanced search via API key
export const POST = withPublic(
  async (request, context, params) => {
    const { db, apiKey, organizationId } = context;
    
    // API key is required for search
    if (!apiKey) {
      return Errors.unauthorized();
    }

    // Validate request body
    const validation = await validateRequest(request, searchRequestSchema);
    if (!validation.success) return validation.response;

    const searchRequest: SearchRequest = validation.data;

    try {
      // Use organization ID from API key
      const orgId = organizationId || apiKey.organizationId;
      
      const orchestrator = new SearchOrchestrator(db, orgId, apiKey.scopes);
      const result = await orchestrator.search(searchRequest);

      // Track search analytics
      await trackApiEvent(
        db,
        'api.post.searched',
        apiKey.organizationId,
        apiKey.id,
        undefined,
        { query: searchRequest.search, entityType: searchRequest.entityType }
      );

      return successResponse(result);
    } catch (error) {
      console.error('Search error:', error);
      return Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      );
    }
  },
  {
    requiredScope: 'posts:search',
    trackAnalytics: true,
  }
);

