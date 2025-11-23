import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse } from '@/lib/api/response';
import { posts } from '@/db/schema';

// GET /api/admin/v1/organizations/:orgId/posts/pending-review
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const pendingPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.organizationId, organizationId!),
        eq(posts.workflowStatus, 'pending_review')
      ),
      orderBy: (posts, { desc }) => [desc(posts.updatedAt)],
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

    return successResponse(pendingPosts);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

