import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { webhooks } from '@/db/schema/webhooks';
import { z } from 'zod';

export const runtime = 'edge';

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

// GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const webhookId = params?.webhookId;
    if (!webhookId) return Errors.badRequest('Webhook ID required');

    const webhook = await db.select().from(webhooks).where(
      and(
        eq(webhooks.id, webhookId),
        eq(webhooks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!webhook) {
      return Errors.notFound('Webhook');
    }

    // Don't return secret
    const safeWebhook = {
      ...webhook,
      secret: undefined,
    };

    return successResponse(safeWebhook);
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/webhooks/:webhookId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const webhookId = params?.webhookId;
    if (!webhookId) return Errors.badRequest('Webhook ID required');

    const validation = await validateRequest(request, updateWebhookSchema);
    if (!validation.success) return validation.response;

    const webhook = await db.select().from(webhooks).where(
      and(
        eq(webhooks.id, webhookId),
        eq(webhooks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!webhook) {
      return Errors.notFound('Webhook');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.url) updateData.url = validation.data.url;
    if (validation.data.events) updateData.events = JSON.stringify(validation.data.events);
    if (validation.data.active !== undefined) updateData.active = validation.data.active;

    const updated = await db
      .update(webhooks)
      .set(updateData)
      .where(eq(webhooks.id, webhookId))
      .returning();

    return successResponse(updated[0]);
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/webhooks/:webhookId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const webhookId = params?.webhookId;
    if (!webhookId) return Errors.badRequest('Webhook ID required');

    const webhook = await db.select().from(webhooks).where(
      and(
        eq(webhooks.id, webhookId),
        eq(webhooks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!webhook) {
      return Errors.notFound('Webhook');
    }

    await db.delete(webhooks).where(eq(webhooks.id, webhookId));

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

