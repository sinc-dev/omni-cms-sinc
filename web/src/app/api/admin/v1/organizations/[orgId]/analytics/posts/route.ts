import { eq, and, desc, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse } from '@/lib/api/response';
import { getPaginationParams, getOffset } from '@/lib/api/validation';
import { posts } from '@/db/schema/posts';
import { postAnalytics } from '@/db/schema/analytics';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/analytics/posts
// Get analytics for all posts
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

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
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(postsWithAnalytics, page, perPage, total);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

