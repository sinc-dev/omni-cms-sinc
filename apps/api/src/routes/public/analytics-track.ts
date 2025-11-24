import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { organizations, posts, analyticsEvents, postAnalytics } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Note: In Cloudflare Workers, use Web Crypto API
async function hashString(input: string): Promise<string> {
  // Simplified - in production use Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

const trackEventSchema = z.object({
  postId: z.string().optional(),
  eventType: z.enum(['view', 'click', 'scroll', 'time']),
  timeOnPage: z.number().optional(), // In seconds
  referrer: z.string().optional(),
});

// POST /api/public/v1/:orgSlug/analytics/track
// Track analytics event (public endpoint)
app.post(
  '/:orgSlug/analytics/track',
  publicMiddleware(),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    
    if (!orgSlug) {
      return c.json(Errors.badRequest('Organization slug required'), 400);
    }

    // Get organization
    const org = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!org) {
      return c.json(Errors.notFound('Organization'), 404);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = trackEventSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(Errors.validationError(validation.error.issues), 400);
    }

    // Hash IP for privacy
    const clientIp = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';
    const ipHash = await hashString(clientIp);

    const userAgent = c.req.header('user-agent') || null;

    // Create analytics event
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      organizationId: org.id,
      postId: validation.data.postId || null,
      eventType: validation.data.eventType,
      userId: null, // Public tracking doesn't have user ID
      metadata: JSON.stringify({
        ipHash,
        userAgent,
        referrer: validation.data.referrer || null,
      }),
      createdAt: new Date(),
    });

    // Update post analytics if postId provided
    if (validation.data.postId && validation.data.eventType === 'view') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const postId = validation.data.postId;

      // Check if analytics record exists for today
      const existing = await db.query.postAnalytics.findFirst({
        where: (pa, { eq, and: andFn }) => andFn(
          eq(pa.postId, postId),
          eq(pa.date, today)
        ),
      });

      if (existing) {
        // Update existing record
        await db
          .update(postAnalytics)
          .set({
            views: existing.views + 1,
            // Note: unique views would need session tracking
            avgTimeOnPage: validation.data.timeOnPage
              ? Math.round(
                  ((existing.avgTimeOnPage || 0) + validation.data.timeOnPage) / 2
                )
              : existing.avgTimeOnPage,
          })
          .where(eq(postAnalytics.id, existing.id));
      } else {
        // Create new record
        await db.insert(postAnalytics).values({
          id: nanoid(),
          postId: postId,
          date: today,
          views: 1,
          uniqueViews: 1,
          avgTimeOnPage: validation.data.timeOnPage || null,
          createdAt: new Date(),
        });
      }
    }

    return c.json(successResponse({ tracked: true }));
  }
);

export default app;

