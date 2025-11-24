import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { paginatedResponse } from '../../lib/api/hono-response';
import { posts, postAnalytics } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/analytics/posts
// Get analytics for all posts
app.get(
  '/:orgId/analytics/posts',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);

    const page = parseInt(c.req.query('page') || '1', 10);
    const perPage = parseInt(c.req.query('per_page') || '20', 10);
    const offset = (page - 1) * perPage;

    // Get posts with aggregated analytics
    const postsWithAnalytics = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        publishedAt: posts.publishedAt,
        totalViews: sql<number>`coalesce(sum(${postAnalytics.views}), 0)`,
        totalUniqueViews: sql<number>`coalesce(sum(${postAnalytics.uniqueViews}), 0)`,
      })
      .from(posts)
      .leftJoin(postAnalytics, eq(posts.id, postAnalytics.postId))
      .where(eq(posts.organizationId, organizationId!))
      .groupBy(posts.id)
      .orderBy(desc(sql`coalesce(sum(${postAnalytics.views}), 0)`))
      .limit(perPage)
      .offset(offset);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.organizationId, organizationId!));
    const total = Number(totalResult[0]?.count || 0);

    return c.json(paginatedResponse(postsWithAnalytics, page, perPage, total));
  }
);

export default app;

