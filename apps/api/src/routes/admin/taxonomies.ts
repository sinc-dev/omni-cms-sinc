import { Hono } from 'hono';
import { eq, and, sql, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { createTaxonomySchema } from '../../lib/validations/taxonomy';
import { taxonomies } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/taxonomies - List taxonomies
app.get(
  '/:orgId/taxonomies',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;

    const whereClauses = [eq(taxonomies.organizationId, organizationId!)];

    if (search) {
      whereClauses.push(like(taxonomies.name, `%${search}%`));
    }

    const allTaxonomies = await db.query.taxonomies.findMany({
      where: and(...whereClauses),
      limit: perPage,
      offset,
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(taxonomies)
      .where(and(...whereClauses));
    const total = totalResult[0]?.count || 0;

    return c.json(paginatedResponse(allTaxonomies, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/taxonomies - Create taxonomy
app.post(
  '/:orgId/taxonomies',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const taxonomyData = createTaxonomySchema.parse(body);
      const { name, slug, isHierarchical } = taxonomyData;

      // Check if slug already exists in this organization
      const existing = await db.query.taxonomies.findFirst({
        where: and(
          eq(taxonomies.organizationId, organizationId!),
          eq(taxonomies.slug, slug)
        ),
      });

      if (existing) {
        return c.json(Errors.badRequest('Taxonomy with this slug already exists in this organization'), 400);
      }

      const newTaxonomy = await db
        .insert(taxonomies)
        .values({
          id: nanoid(),
          organizationId: organizationId!,
          name,
          slug,
          isHierarchical: isHierarchical || false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newTaxonomyArray = Array.isArray(newTaxonomy) ? newTaxonomy : [newTaxonomy];
      if (newTaxonomyArray.length === 0) {
        return c.json(Errors.serverError('Failed to create taxonomy'), 500);
      }
      return c.json(successResponse(newTaxonomyArray[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating taxonomy:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create taxonomy'
      ), 500);
    }
  }
);

export default app;

