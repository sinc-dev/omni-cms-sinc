import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { paginatedResponse, Errors } from '../../lib/api/hono-response';
import { webhooks, webhookLogs } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId/logs
app.get(
  '/:orgId/webhooks/:webhookId/logs',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const webhookId = c.req.param('webhookId');

    if (!webhookId) {
      return c.json(Errors.badRequest('Webhook ID required'), 400);
    }

    // Verify webhook belongs to organization
    const webhook = await db.query.webhooks.findFirst({
      where: (w, { eq, and: andFn }) => andFn(
        eq(w.id, webhookId),
        eq(w.organizationId, organizationId!)
      ),
    });

    if (!webhook) {
      return c.json(Errors.notFound('Webhook'), 404);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const perPage = parseInt(c.req.query('per_page') || '20', 10);
    const offset = (page - 1) * perPage;

    const logs = await db.query.webhookLogs.findMany({
      where: (wl, { eq }) => eq(wl.webhookId, webhookId),
      limit: perPage,
      offset,
      orderBy: [desc(webhookLogs.createdAt)],
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, webhookId));
    const total = Number(totalResult[0]?.count || 0);

    return c.json(paginatedResponse(logs, page, perPage, total));
  }
);

export default app;

