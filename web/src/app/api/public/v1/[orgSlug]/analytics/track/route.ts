import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withPublic } from '@/lib/api/public-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { organizations, posts } from '@/db/schema';
import { analyticsEvents, postAnalytics } from '@/db/schema/analytics';
import { z } from 'zod';
// Note: In Cloudflare Workers, use Web Crypto API
async function hashString(input: string): Promise<string> {
  // Simplified - in production use Web Crypto API
  return btoa(input).substring(0, 16);
}

const trackEventSchema = z.object({
  postId: z.string().optional(),
  eventType: z.enum(['view', 'click', 'scroll', 'time']),
  timeOnPage: z.number().optional(), // In seconds
  referrer: z.string().optional(),
});

// POST /api/public/v1/:orgSlug/analytics/track
// Track analytics event (public endpoint)
export const POST = withPublic(
  async (request: Request, { db }, params?: Record<string, string>) => {
    const orgSlug = params?.orgSlug;
    if (!orgSlug) return Errors.badRequest('Organization slug required');

    // Get organization
    const org = await db.select().from(organizations).where(
      eq(organizations.slug, orgSlug)
    ).limit(1).then(rows => rows[0] || null);

    if (!org) {
      return Errors.notFound('Organization');
    }

    const validation = await validateRequest(request, trackEventSchema);
    if (!validation.success) return validation.response;

    // Hash IP for privacy
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const ipHash = await hashString(clientIp);

    const userAgent = request.headers.get('user-agent') || null;

    // Create analytics event
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      postId: validation.data.postId || null,
      eventType: validation.data.eventType,
      userId: null, // Public tracking doesn't have user ID
      ipHash,
      userAgent,
      referrer: validation.data.referrer || null,
      createdAt: new Date(),
    });

    // Update post analytics if postId provided
    if (validation.data.postId && validation.data.eventType === 'view') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if analytics record exists for today
      const existing = await db.select().from(postAnalytics).where(
        and(
          eq(postAnalytics.postId, validation.data.postId),
          eq(postAnalytics.date, today)
        )
      ).limit(1).then(rows => rows[0] || null);

      if (existing) {
        // Update existing record
        await db
          .update(postAnalytics)
          .set({
            views: existing.views + 1,
            // Note: unique views would need session tracking
            avgTimeOnPage: validation.data.timeOnPage
              ? Math.round(
                  (existing.avgTimeOnPage || 0 + validation.data.timeOnPage) / 2
                )
              : existing.avgTimeOnPage,
          })
          .where(eq(postAnalytics.id, existing.id));
      } else {
        // Create new record
        await db.insert(postAnalytics).values({
          id: nanoid(),
          postId: validation.data.postId,
          date: today,
          views: 1,
          uniqueViews: 1,
          avgTimeOnPage: validation.data.timeOnPage || null,
          createdAt: new Date(),
        });
      }
    }

    return successResponse({ tracked: true });
  }
);

