import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { webhooks } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

// GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId
app.get(
  '/:orgId/webhooks/:webhookId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const webhookId = c.req.param('webhookId');

    const webhook = await db.query.webhooks.findFirst({
      where: (w, { eq, and: andFn }) => andFn(
        eq(w.id, webhookId),
        eq(w.organizationId, organizationId!)
      ),
    });

    if (!webhook) {
      return c.json(Errors.notFound('Webhook'), 404);
    }

    // Don't return secret
    const safeWebhook = {
      ...webhook,
      secret: undefined,
    };

    return c.json(successResponse(safeWebhook));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/webhooks/:webhookId
app.patch(
  '/:orgId/webhooks/:webhookId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const webhookId = c.req.param('webhookId');

    const webhook = await db.query.webhooks.findFirst({
      where: (w, { eq, and: andFn }) => andFn(
        eq(w.id, webhookId),
        eq(w.organizationId, organizationId!)
      ),
    });

    if (!webhook) {
      return c.json(Errors.notFound('Webhook'), 404);
    }

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateWebhookSchema.parse(body);
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
    if (updateData.url) updatePayload.url = updateData.url;
    if (updateData.events) updatePayload.events = JSON.stringify(updateData.events);
    if (updateData.active !== undefined) updatePayload.active = updateData.active;

    const updated = await db
      .update(webhooks)
      .set(updatePayload)
      .where(eq(webhooks.id, webhookId))
      .returning();

    return c.json(successResponse(updated[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/webhooks/:webhookId
app.delete(
  '/:orgId/webhooks/:webhookId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const webhookId = c.req.param('webhookId');

    const webhook = await db.query.webhooks.findFirst({
      where: (w, { eq, and: andFn }) => andFn(
        eq(w.id, webhookId),
        eq(w.organizationId, organizationId!)
      ),
    });

    if (!webhook) {
      return c.json(Errors.notFound('Webhook'), 404);
    }

    await db.delete(webhooks).where(eq(webhooks.id, webhookId));

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

