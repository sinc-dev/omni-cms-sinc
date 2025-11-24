import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { updateCustomFieldSchema } from '../../lib/validations/post-type';
import { customFields } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
app.get(
  '/:orgId/custom-fields/:fieldId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('custom-fields:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const fieldId = c.req.param('fieldId');

    const field = await db.query.customFields.findFirst({
      where: (cf, { eq, and: andFn }) => andFn(
        eq(cf.id, fieldId),
        eq(cf.organizationId, organizationId!)
      ),
    });

    if (!field) {
      return c.json(Errors.notFound('Custom Field'), 404);
    }

    return c.json(successResponse(field));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
app.patch(
  '/:orgId/custom-fields/:fieldId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('custom-fields:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const fieldId = c.req.param('fieldId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateCustomFieldSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const updated = await db
      .update(customFields)
      .set({
        ...updateData,
        settings: updateData.settings ? JSON.stringify(updateData.settings) : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customFields.id, fieldId),
          eq(customFields.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Custom Field'), 404);
    }

    return c.json(successResponse(updatedArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
app.delete(
  '/:orgId/custom-fields/:fieldId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('custom-fields:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const fieldId = c.req.param('fieldId');

    const deleted = await db
      .delete(customFields)
      .where(
        and(
          eq(customFields.id, fieldId),
          eq(customFields.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return c.json(Errors.notFound('Custom Field'), 404);
    }

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

