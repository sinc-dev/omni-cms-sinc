import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { updateTaxonomyTermSchema } from '../../lib/validations/taxonomy';
import { taxonomyTerms, taxonomies } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
app.patch(
  '/:orgId/taxonomies/:taxonomyId/terms/:termId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');
    const termId = c.req.param('termId');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateTaxonomyTermSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // If parentId is being updated, verify it exists in same taxonomy
    if (updateData.parentId !== undefined) {
      if (updateData.parentId) {
        const parent = await db.query.taxonomyTerms.findFirst({
          where: (tt, { eq, and: andFn }) => andFn(
            eq(tt.id, updateData.parentId!),
            eq(tt.taxonomyId, taxonomyId)
          ),
        });
        
        if (!parent) {
          return c.json(Errors.badRequest('Parent term not found in this taxonomy'), 400);
        }
      }
    }

    const updated = await db
      .update(taxonomyTerms)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taxonomyTerms.id, termId),
          eq(taxonomyTerms.taxonomyId, taxonomyId)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Term'), 404);
    }

    return c.json(successResponse(updatedArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
app.delete(
  '/:orgId/taxonomies/:taxonomyId/terms/:termId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('taxonomies:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const taxonomyId = c.req.param('taxonomyId');
    const termId = c.req.param('termId');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.id, taxonomyId),
        eq(t.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    const deleted = await db
      .delete(taxonomyTerms)
      .where(
        and(
          eq(taxonomyTerms.id, termId),
          eq(taxonomyTerms.taxonomyId, taxonomyId)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return c.json(Errors.notFound('Term'), 404);
    }

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

