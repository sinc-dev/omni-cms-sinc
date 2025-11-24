import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { updatePostTypeSchema } from '../../lib/validations/post-type';
import { postTypes } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/post-types/:typeId
app.get(
  '/:orgId/post-types/:typeId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const typeId = c.req.param('typeId');

    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, typeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    return c.json(successResponse(postType));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/post-types/:typeId
app.patch(
  '/:orgId/post-types/:typeId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const typeId = c.req.param('typeId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updatePostTypeSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // Check if slug is being updated and conflicts with existing
    if (updateData.slug) {
      const existing = await db.query.postTypes.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, organizationId!),
          eq(pt.slug, updateData.slug!)
        ),
      });

      // If found and it's not the current type, it's a conflict
      if (existing && existing.id !== typeId) {
        return c.json(Errors.badRequest('Post type with this slug already exists'), 400);
      }
    }

    const updated = await db
      .update(postTypes)
      .set({
        ...updateData,
        settings: updateData.settings ? JSON.stringify(updateData.settings) : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(postTypes.id, typeId),
          eq(postTypes.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    return c.json(successResponse(updatedArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/post-types/:typeId
app.delete(
  '/:orgId/post-types/:typeId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const typeId = c.req.param('typeId');

    // Check if post type exists
    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, typeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    // TODO: Check if there are posts using this type before deletion
    // For now, we'll allow deletion

    await db
      .delete(postTypes)
      .where(
        and(
          eq(postTypes.id, typeId),
          eq(postTypes.organizationId, organizationId!)
        )
      );

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

