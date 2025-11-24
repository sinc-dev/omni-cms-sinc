import { Hono } from 'hono';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postAnalytics } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/analytics
// Get analytics overview
app.get(
  '/:orgId/analytics',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    const fromDate = c.req.query('from');
    const toDate = c.req.query('to');
    const postId = c.req.query('post_id');

    // Build date range
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const to = toDate ? new Date(toDate) : new Date();

    if (postId) {
      // Get analytics for specific post
      const analytics = await db.query.postAnalytics.findMany({
        where: (pa, { eq, and: andFn, gte: gteFn, lte: lteFn }) => andFn(
          eq(pa.postId, postId),
          gteFn(pa.date, from),
          lteFn(pa.date, to)
        ),
        orderBy: [desc(postAnalytics.date)],
      });

      // Calculate totals
      const totals = analytics.reduce(
        (acc, a) => ({
          views: acc.views + a.views,
          uniqueViews: acc.uniqueViews + a.uniqueViews,
          avgTimeOnPage: acc.avgTimeOnPage + (a.avgTimeOnPage || 0),
        }),
        { views: 0, uniqueViews: 0, avgTimeOnPage: 0 }
      );

      return c.json(successResponse({
        postId,
        period: { from, to },
        analytics,
        totals: {
          ...totals,
          avgTimeOnPage: totals.avgTimeOnPage / analytics.length || 0,
        },
      }));
    } else {
      // Get overview for all posts in organization
      const postIds = await db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.organizationId, organizationId!));

      const postIdList = postIds.map((p) => p.id);

      if (postIdList.length === 0) {
        return c.json(successResponse({
          period: { from, to },
          daily: [],
          totals: {
            views: 0,
            uniqueViews: 0,
          },
        }));
      }

      // Get aggregated analytics for all posts
      const allAnalytics = await db
        .select({
          views: sql<number>`sum(${postAnalytics.views})`,
          uniqueViews: sql<number>`sum(${postAnalytics.uniqueViews})`,
          date: postAnalytics.date,
        })
        .from(postAnalytics)
        .where(and(
          inArray(postAnalytics.postId, postIdList),
          gte(postAnalytics.date, from),
          lte(postAnalytics.date, to)
        ))
        .groupBy(postAnalytics.date)
        .orderBy(desc(postAnalytics.date));

      const totalViews = allAnalytics.reduce((sum, a) => sum + (Number(a.views) || 0), 0);
      const totalUniqueViews = allAnalytics.reduce((sum, a) => sum + (Number(a.uniqueViews) || 0), 0);

      return c.json(successResponse({
        period: { from, to },
        daily: allAnalytics,
        totals: {
          views: totalViews,
          uniqueViews: totalUniqueViews,
        },
      }));
    }
  }
);

export default app;

