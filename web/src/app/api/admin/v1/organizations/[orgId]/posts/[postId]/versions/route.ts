import { eq, and, desc } from 'drizzle-orm';
import { users } from '@/db/schema/users';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postVersions } from '@/db/schema/post-versions';

// GET /api/admin/v1/organizations/:orgId/posts/:postId/versions
// List all versions for a post
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return Errors.notFound('Post');
    }

    // Get all versions
    const versionsData = await db.select().from(postVersions).where(
      eq(postVersions.postId, postId)
    ).orderBy(desc(postVersions.versionNumber));
    
    // Get creator info for each version
    const versions = await Promise.all(
      versionsData.map(async (v: typeof postVersions.$inferSelect) => {
        const creator = await db.query.users.findFirst({
          where: eq(users.id, v.createdBy),
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });
        return {
          ...v,
          creator: creator || null,
        };
      })
    );

    return successResponse(versions);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

