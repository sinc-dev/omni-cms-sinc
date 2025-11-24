import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse } from '../../lib/api/hono-response';
import { posts } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/posts/pending-review
app.get(
  '/:orgId/posts/pending-review',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);

    const pendingPosts = await db.query.posts.findMany({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organizationId!),
        eq(p.workflowStatus, 'pending_review')
      ),
      orderBy: [desc(posts.updatedAt)],
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        postType: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return c.json(successResponse(pendingPosts));
  }
);

export default app;

