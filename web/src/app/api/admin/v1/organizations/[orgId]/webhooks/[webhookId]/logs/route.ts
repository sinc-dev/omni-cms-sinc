import { eq, and, desc, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { getPaginationParams, getOffset } from '@/lib/api/validation';
import { webhooks, webhookLogs } from '@/db/schema/webhooks';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId/logs
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const webhookId = params?.webhookId;
    if (!webhookId) return Errors.badRequest('Webhook ID required');

    // Verify webhook belongs to organization
    const webhook = await db.select().from(webhooks).where(
      and(
        eq(webhooks.id, webhookId),
        eq(webhooks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!webhook) {
      return Errors.notFound('Webhook');
    }

    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const logs = await db.select().from(webhookLogs).where(
      eq(webhookLogs.webhookId, webhookId)
    ).limit(perPage).offset(offset).orderBy(desc(webhookLogs.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookId, webhookId));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(logs, page, perPage, total);
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

