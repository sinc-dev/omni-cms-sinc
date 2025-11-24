import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { webhooks, webhookLogs } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Note: In Cloudflare Workers, use Web Crypto API
async function createHmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// POST /api/admin/v1/organizations/:orgId/webhooks/:webhookId/test
// Test webhook delivery
app.post(
  '/:orgId/webhooks/:webhookId/test',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const webhookId = c.req.param('webhookId');

    if (!webhookId) {
      return c.json(Errors.badRequest('Webhook ID required'), 400);
    }

    const webhook = await db.query.webhooks.findFirst({
      where: (w, { eq, and: andFn }) => andFn(
        eq(w.id, webhookId),
        eq(w.organizationId, organizationId!)
      ),
    });

    if (!webhook) {
      return c.json(Errors.notFound('Webhook'), 404);
    }

    // Create test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook',
      },
    };

    // Generate HMAC signature
    const signature = await createHmac(webhook.secret, JSON.stringify(testPayload));

    // Send webhook
    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': testPayload.event,
        },
        body: JSON.stringify(testPayload),
      });

      responseStatus = response.status;
      responseBody = await response.text();
    } catch (error) {
      responseStatus = 0;
      responseBody = error instanceof Error ? error.message : 'Network error';
    }

    // Log webhook delivery
    await db.insert(webhookLogs).values({
      id: nanoid(),
      webhookId,
      event: testPayload.event,
      payload: JSON.stringify(testPayload),
      responseStatus,
      responseBody,
      createdAt: new Date(),
    });

    return c.json(successResponse({
      success: responseStatus === 200,
      status: responseStatus,
      response: responseBody,
    }));
  }
);

export default app;

