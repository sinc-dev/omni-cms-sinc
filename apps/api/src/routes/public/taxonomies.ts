import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { organizations, taxonomies, taxonomyTerms } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug - Get taxonomy with terms
app.get(
  '/:orgSlug/taxonomies/:taxonomySlug',
  publicMiddleware({ trackAnalytics: true }),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    const taxonomySlug = c.req.param('taxonomySlug');

    if (!orgSlug || !taxonomySlug) {
      return c.json(Errors.badRequest('Organization slug and taxonomy slug required'), 400);
    }

    // Find organization by slug (public routes don't require API key, but can use it)
    const organization = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!organization) {
      return c.json(Errors.notFound('Organization'), 404);
    }
    
    // If API key is provided, verify it matches the organization
    const context = getPublicContext(c);
    if (context.apiKey && context.apiKey.organizationId !== organization.id) {
      return c.json(Errors.forbidden(), 403);
    }

    // Find taxonomy by slug
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.organizationId, organization.id),
        eq(t.slug, taxonomySlug)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    // Fetch all terms for this taxonomy
    const terms = await db.query.taxonomyTerms.findMany({
      where: (tt, { eq }) => eq(tt.taxonomyId, taxonomy.id),
    });

    // Build hierarchical structure if needed
    const termsWithChildren = taxonomy.isHierarchical
      ? terms.map((term) => ({
          ...term,
          children: terms.filter((t) => t.parentId === term.id),
        }))
      : terms;

    const taxonomyWithTerms = {
      ...taxonomy,
      terms: termsWithChildren,
    };

    // Set caching headers (15 minutes)
    return c.json(successResponse(taxonomyWithTerms), 200, {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    });
  }
);

export default app;

