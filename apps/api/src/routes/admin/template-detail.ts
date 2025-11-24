import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { postTemplates } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  postTypeId: z.string().min(1).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/templates/:templateId
app.get(
  '/:orgId/templates/:templateId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const templateId = c.req.param('templateId');

    const template = await db.query.postTemplates.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, templateId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!template) {
      return c.json(Errors.notFound('Template'), 404);
    }

    return c.json(successResponse(template));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/templates/:templateId
app.patch(
  '/:orgId/templates/:templateId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const templateId = c.req.param('templateId');

    const template = await db.query.postTemplates.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, templateId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!template) {
      return c.json(Errors.notFound('Template'), 404);
    }

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateTemplateSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.slug) updatePayload.slug = updateData.slug;
    if (updateData.postTypeId) updatePayload.postTypeId = updateData.postTypeId;
    if (updateData.content) updatePayload.content = JSON.stringify(updateData.content);
    if (updateData.customFields !== undefined) {
      updatePayload.customFields = updateData.customFields
        ? JSON.stringify(updateData.customFields)
        : null;
    }

    // Check slug conflict if slug is being updated
    if (updateData.slug && updateData.slug !== template.slug) {
      const existing = await db.query.postTemplates.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, organizationId!),
          eq(pt.slug, updateData.slug!)
        ),
      });

      if (existing && existing.id !== templateId) {
        return c.json(Errors.badRequest('Template with this slug already exists'), 400);
      }
    }

    const updated = await db
      .update(postTemplates)
      .set(updatePayload)
      .where(eq(postTemplates.id, templateId))
      .returning();

    return c.json(successResponse(updated[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/templates/:templateId
app.delete(
  '/:orgId/templates/:templateId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const templateId = c.req.param('templateId');

    const template = await db.query.postTemplates.findFirst({
      where: (pt, { eq, and: andFn }) => andFn(
        eq(pt.id, templateId),
        eq(pt.organizationId, organizationId!)
      ),
    });

    if (!template) {
      return c.json(Errors.notFound('Template'), 404);
    }

    await db.delete(postTemplates).where(eq(postTemplates.id, templateId));

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

