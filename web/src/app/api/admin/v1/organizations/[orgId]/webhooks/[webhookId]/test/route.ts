import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { webhooks, webhookLogs } from '@/db/schema/webhooks';
// Note: In Cloudflare Workers, use Web Crypto API
async function createHmac(secret: string, data: string): Promise<string> {
  return btoa(secret + data).substring(0, 64);
}

// POST /api/admin/v1/organizations/:orgId/webhooks/:webhookId/test
// Test webhook delivery
export const POST = withAuth(
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

    return successResponse({
      success: responseStatus === 200,
      status: responseStatus,
      response: responseBody,
    });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

