import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postAnalytics, analyticsEvents } from '@/db/schema/analytics';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/analytics/overview
// Get analytics overview
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    const postId = url.searchParams.get('post_id');

    // Build date range
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const to = toDate ? new Date(toDate) : new Date();

    const conditions = [gte(postAnalytics.date, from), lte(postAnalytics.date, to)];

    // Get analytics for posts in this organization
    const postIds = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.organizationId, organizationId!));

    const postIdList = postIds.map((p) => p.id);

    if (postId) {
      // Get analytics for specific post
      const analytics = await db.select().from(postAnalytics).where(
        and(
          eq(postAnalytics.postId, postId),
          ...(conditions as [ReturnType<typeof gte>, ReturnType<typeof lte>])
        )
      ).orderBy(desc(postAnalytics.date));

      // Calculate totals
      const totals = analytics.reduce(
        (acc: { views: number; uniqueViews: number; avgTimeOnPage: number }, a: typeof postAnalytics.$inferSelect) => ({
          views: acc.views + a.views,
          uniqueViews: acc.uniqueViews + a.uniqueViews,
          avgTimeOnPage: acc.avgTimeOnPage + (a.avgTimeOnPage || 0),
        }),
        { views: 0, uniqueViews: 0, avgTimeOnPage: 0 }
      );

      return successResponse({
        postId,
        period: { from, to },
        analytics,
        totals: {
          ...totals,
          avgTimeOnPage: totals.avgTimeOnPage / analytics.length || 0,
        },
      });
    } else {
      // Get overview for all posts
      const allAnalytics = await db
        .select({
          views: sql<number>`sum(${postAnalytics.views})`,
          uniqueViews: sql<number>`sum(${postAnalytics.uniqueViews})`,
          date: postAnalytics.date,
        })
        .from(postAnalytics)
        .where(and(...conditions))
        .groupBy(postAnalytics.date)
        .orderBy(desc(postAnalytics.date));

      const totalViews = allAnalytics.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalUniqueViews = allAnalytics.reduce((sum, a) => sum + (a.uniqueViews || 0), 0);

      return successResponse({
        period: { from, to },
        daily: allAnalytics,
        totals: {
          views: totalViews,
          uniqueViews: totalUniqueViews,
        },
      });
    }
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

