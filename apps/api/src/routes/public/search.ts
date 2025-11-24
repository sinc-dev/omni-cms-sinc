import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext, trackApiEvent } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { SearchOrchestrator } from '../../lib/search/search-orchestrator';
import { searchRequestSchema } from '../../lib/validations/search';
import { z } from 'zod';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/public/v1/:orgSlug/search
// HubSpot-style advanced search via API key
app.post(
  '/:orgSlug/search',
  publicMiddleware({ requiredScope: 'posts:search', trackAnalytics: true }),
  async (c) => {
    const context = getPublicContext(c);
    const { db, apiKey } = context;
    
    // API key is required for search
    if (!apiKey) {
      return c.json(Errors.unauthorized(), 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = searchRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(Errors.validationError(validation.error.issues), 400);
    }

    const searchRequest = validation.data;

    try {
      // Use organization ID from API key
      const orgId = context.organizationId || apiKey.organizationId;
      
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

      return c.json(successResponse(result));
    } catch (error) {
      console.error('Search error:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to execute search'
      ), 500);
    }
  }
);

export default app;

