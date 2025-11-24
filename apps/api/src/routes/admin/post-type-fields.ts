import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { postTypes, customFields, postTypeFields } from '../../db/schema';
import { z } from 'zod';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const attachFieldSchema = z.object({
  customFieldId: z.string().min(1),
  isRequired: z.boolean().default(false),
  order: z.number().int().default(0),
  defaultValue: z.string().optional(),
});

const reorderFieldsSchema = z.object({
  fieldOrders: z.array(z.object({
    fieldId: z.string().min(1),
    order: z.number().int(),
  })),
});

// GET /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields
app.get(
  '/:orgId/post-types/:postTypeId/fields',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postTypeId = c.req.param('postTypeId');

    // Verify post type exists and belongs to organization
    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, postTypeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    // Get attached fields
    const attachedFields = await db.query.postTypeFields.findMany({
      where: (ptf, { eq }) => eq(ptf.postTypeId, postTypeId),
      orderBy: (ptf, { asc }) => [asc(ptf.order)],
      with: {
        customField: true,
      },
    });

    // Format response
    const formattedFields = attachedFields.map((ptf) => ({
      id: ptf.id,
      postTypeId: ptf.postTypeId,
      customFieldId: ptf.customFieldId,
      isRequired: ptf.isRequired,
      defaultValue: ptf.defaultValue,
      order: ptf.order,
      createdAt: ptf.createdAt,
      customField: ptf.customField,
    }));

    return c.json(successResponse(formattedFields));
  }
);

// POST /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields
app.post(
  '/:orgId/post-types/:postTypeId/fields',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postTypeId = c.req.param('postTypeId');

    let body;
    try {
      body = await c.req.json();
      attachFieldSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const { customFieldId, isRequired, order, defaultValue } = body;

    // Verify post type exists and belongs to organization
    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, postTypeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    // Verify custom field exists and belongs to organization
    const customField = await db.query.customFields.findFirst({
      where: (cf, { eq, and: andFn }) => andFn(
        eq(cf.id, customFieldId),
        eq(cf.organizationId, organizationId!)
      ),
    });

    if (!customField) {
      return c.json(Errors.notFound('Custom field'), 404);
    }

    // Check if field is already attached
    const existing = await db.query.postTypeFields.findFirst({
      where: (ptf, { eq, and: andFn }) => andFn(
        eq(ptf.postTypeId, postTypeId),
        eq(ptf.customFieldId, customFieldId)
      ),
    });

    if (existing) {
      return c.json(Errors.badRequest('Field is already attached to this post type'), 400);
    }

    // Create attachment
    const newAttachment = await db
      .insert(postTypeFields)
      .values({
        id: nanoid(),
        postTypeId,
        customFieldId,
        isRequired: isRequired ?? false,
        order: order ?? 0,
        defaultValue: defaultValue || null,
        createdAt: new Date(),
      })
      .returning();

    const attachmentArray = Array.isArray(newAttachment) ? newAttachment : [newAttachment];
    if (attachmentArray.length === 0) {
      return c.json(Errors.serverError('Failed to attach field'), 500);
    }

    // Fetch with custom field details
    const attachment = await db.query.postTypeFields.findFirst({
      where: (ptf, { eq }) => eq(ptf.id, attachmentArray[0].id),
      with: {
        customField: true,
      },
    });

    return c.json(successResponse(attachment));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields/:fieldId
app.delete(
  '/:orgId/post-types/:postTypeId/fields/:fieldId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postTypeId = c.req.param('postTypeId');
    const fieldId = c.req.param('fieldId');

    // Verify post type exists and belongs to organization
    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, postTypeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    // Verify attachment exists
    const attachment = await db.query.postTypeFields.findFirst({
      where: (ptf, { eq, and: andFn }) => andFn(
        eq(ptf.id, fieldId),
        eq(ptf.postTypeId, postTypeId)
      ),
    });

    if (!attachment) {
      return c.json(Errors.notFound('Field attachment'), 404);
    }

    // Delete attachment
    await db
      .delete(postTypeFields)
      .where(eq(postTypeFields.id, fieldId));

    return c.json(successResponse({ deleted: true }));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields/reorder
app.patch(
  '/:orgId/post-types/:postTypeId/fields/reorder',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postTypeId = c.req.param('postTypeId');

    let body;
    try {
      body = await c.req.json();
      reorderFieldsSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const { fieldOrders } = body as z.infer<typeof reorderFieldsSchema>;

    // Verify post type exists and belongs to organization
    const postType = await db.query.postTypes.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, postTypeId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!postType) {
      return c.json(Errors.notFound('Post type'), 404);
    }

    // Update order for each field
    const updates = await Promise.all(
      fieldOrders.map(async ({ fieldId, order }) => {
        const attachment = await db.query.postTypeFields.findFirst({
          where: (ptf, { eq, and: andFn }) => andFn(
            eq(ptf.id, fieldId),
            eq(ptf.postTypeId, postTypeId)
          ),
        });

        if (!attachment) {
          return null;
        }

        const updated = await db
          .update(postTypeFields)
          .set({ order })
          .where(eq(postTypeFields.id, fieldId))
          .returning();

        return Array.isArray(updated) ? updated[0] : updated;
      })
    );

    const successfulUpdates = updates.filter((u) => u !== null);

    return c.json(successResponse({ updated: successfulUpdates.length }));
  }
);

export default app;

