import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset } from '@/lib/api/validation';
import { webhooks } from '@/db/schema/webhooks';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Valid URL is required'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  active: z.boolean().optional().default(true),
});

const updateWebhookSchema = createWebhookSchema.partial();

// GET /api/admin/v1/organizations/:orgId/webhooks
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const allWebhooks = await db.select().from(webhooks).where(
      eq(webhooks.organizationId, organizationId!)
    ).limit(perPage).offset(offset).orderBy(desc(webhooks.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId!));
    const total = totalResult[0]?.count || 0;

    // Don't return secrets in list
    const safeWebhooks = allWebhooks.map((webhook: typeof webhooks.$inferSelect) => ({
      ...webhook,
      secret: undefined, // Remove secret from response
    }));

    return paginatedResponse(safeWebhooks, page, perPage, total);
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/webhooks
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createWebhookSchema);
    if (!validation.success) return validation.response;

    // Generate secret for HMAC signing (32 bytes = 64 hex characters)
    const secret = randomBytes(32).toString('hex');

    const newWebhook = await db
      .insert(webhooks)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name: validation.data.name,
        url: validation.data.url,
        events: JSON.stringify(validation.data.events),
        secret,
        active: validation.data.active ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Return webhook with secret (only shown once)
    return successResponse({
      ...newWebhook[0],
      secret, // Include secret in response for user to save
      warning: 'Save this secret securely. It will not be shown again.',
    });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

