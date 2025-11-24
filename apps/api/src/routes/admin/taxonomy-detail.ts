import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { updateTaxonomySchema } from '../../lib/validations/taxonomy';
import { taxonomies } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
app.get(
  '/:orgId/taxonomies/:taxonomyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');

    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
      with: {
        terms: true, // Include terms
      },
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    return c.json(successResponse(taxonomy));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
app.patch(
  '/:orgId/taxonomies/:taxonomyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateTaxonomySchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // Check if slug is being updated and conflicts with existing
    if (updateData.slug) {
      const existing = await db.query.taxonomies.findFirst({
        where: (t, { eq, and: andFn }) => andFn(
          eq(t.organizationId, organizationId!),
          eq(t.slug, updateData.slug!)
        ),
      });

      // If found and it's not the current taxonomy, it's a conflict
      if (existing && existing.id !== taxonomyId) {
        return c.json(Errors.badRequest('Taxonomy with this slug already exists'), 400);
      }
    }

    const updated = await db
      .update(taxonomies)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taxonomies.id, taxonomyId),
          eq(taxonomies.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    return c.json(successResponse(updatedArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
app.delete(
  '/:orgId/taxonomies/:taxonomyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');

    // Check if taxonomy exists
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    // TODO: Check if there are posts using this taxonomy before deletion
    // For now, we'll allow deletion

    await db
      .delete(taxonomies)
      .where(
        and(
          eq(taxonomies.id, taxonomyId),
          eq(taxonomies.organizationId, organizationId!)
        )
      );

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

