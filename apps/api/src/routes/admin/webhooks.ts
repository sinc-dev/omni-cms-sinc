import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { webhooks } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Web Crypto compatible replacement for randomBytes(size).toString('hex')
function generateSecret(size: number = 32): string {
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Valid URL is required'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  active: z.boolean().optional().default(true),
});

// GET /api/admin/v1/organizations/:orgId/webhooks
app.get(
  '/:orgId/webhooks',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId!))
      .limit(perPage)
      .offset(offset)
      .orderBy(desc(webhooks.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhooks)
      .where(eq(webhooks.organizationId, organizationId!));
    const total = totalResult[0]?.count || 0;

    // Don't return secrets in list
    const safeWebhooks = allWebhooks.map((webhook: any) => ({
      ...webhook,
      secret: undefined, // Remove secret from response
    }));

    return c.json(paginatedResponse(safeWebhooks, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/webhooks
app.post(
  '/:orgId/webhooks',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const webhookData = createWebhookSchema.parse(body);

      // Generate secret for HMAC signing (32 bytes = 64 hex characters)
      const secret = generateSecret(32);

      const newWebhook = await db
        .insert(webhooks)
        .values({
          id: nanoid(),
          organizationId: organizationId!,
          name: webhookData.name,
          url: webhookData.url,
          events: JSON.stringify(webhookData.events),
          secret,
          active: webhookData.active ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Return webhook with secret (only shown once)
      return c.json(successResponse({
        ...newWebhook[0],
        secret, // Include secret in response for user to save
        warning: 'Save this secret securely. It will not be shown again.',
      }));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating webhook:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create webhook'
      ), 500);
    }
  }
);

export default app;

