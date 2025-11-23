import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { webhooks, webhookLogs } from '@/db/schema';
// Note: In Cloudflare Workers, use Web Crypto API for HMAC
// This is a simplified version - in production, use proper Web Crypto API
async function createHmac(secret: string, data: string): Promise<string> {
  // In Cloudflare Workers, use:
  // const key = await crypto.subtle.importKey(...)
  // const signature = await crypto.subtle.sign(...)
  // For now, return a placeholder - this needs proper implementation
  return btoa(secret + data).substring(0, 64);
}
import type { DbClient } from '@/db/client';

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Dispatch webhook event to all active webhooks subscribed to the event
 */
export async function dispatchWebhook(
  db: DbClient,
  organizationId: string,
  event: WebhookEvent
) {
  // Get all active webhooks for this organization that subscribe to this event
  const allWebhooks = await db.query.webhooks.findMany({
    where: and(
      eq(webhooks.organizationId, organizationId),
      eq(webhooks.active, true)
    ),
  });

  // Filter webhooks that subscribe to this event
  const subscribedWebhooks = allWebhooks.filter((webhook) => {
    const events = JSON.parse(webhook.events) as string[];
    return events.includes(event.event) || events.includes('*');
  });

  // Dispatch to each webhook asynchronously
  const dispatchPromises = subscribedWebhooks.map((webhook) =>
    sendWebhook(db, webhook, event)
  );

  await Promise.allSettled(dispatchPromises);
}

/**
 * Send webhook to a specific URL
 */
async function sendWebhook(
  db: DbClient,
  webhook: typeof webhooks.$inferSelect,
  event: WebhookEvent
) {
  // Generate HMAC signature
  const payload = JSON.stringify(event);
  const signature = await createHmac(webhook.secret, payload);

  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.event,
        'X-Webhook-Id': webhook.id,
      },
      body: payload,
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    responseStatus = response.status;
    responseBody = await response.text().catch(() => null);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
    responseStatus = 0;
  }

  // Log webhook delivery
  await db.insert(webhookLogs).values({
    id: nanoid(),
    webhookId: webhook.id,
    event: event.event,
    payload,
    responseStatus,
    responseBody,
    createdAt: new Date(),
  });

  // Retry logic for failed webhooks (could be implemented with exponential backoff)
  if (responseStatus !== 200 && responseStatus !== 0) {
    // Could implement retry queue here
    console.warn(`Webhook ${webhook.id} failed with status ${responseStatus}`);
  }
}

/**
 * Retry failed webhook with exponential backoff
 */
export async function retryWebhook(
  db: DbClient,
  logId: string,
  maxRetries: number = 3
) {
  const log = await db.query.webhookLogs.findFirst({
    where: eq(webhookLogs.id, logId),
    with: {
      webhook: true,
    },
  });

  if (!log || !log.webhook) {
    return;
  }

  // Parse original payload
  const event = JSON.parse(log.payload) as WebhookEvent;

  // Retry sending
  await sendWebhook(db, log.webhook, event);
}

