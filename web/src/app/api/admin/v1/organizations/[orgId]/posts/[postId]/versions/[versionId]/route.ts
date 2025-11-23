import { eq, and } from 'drizzle-orm';
import { users } from '@/db/schema/users';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postVersions } from '@/db/schema/post-versions';

// GET /api/admin/v1/organizations/:orgId/posts/:postId/versions/:versionId
// Get a specific version
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const postId = params?.postId;
    const versionId = params?.versionId;
    if (!postId || !versionId) return Errors.badRequest('Post ID and Version ID required');

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

    // Get version
    const versionData = await db.select().from(postVersions).where(
      and(
        eq(postVersions.id, versionId),
        eq(postVersions.postId, postId)
      )
    ).limit(1).then(rows => rows[0] || null);
    
    if (!versionData) {
      return Errors.notFound('Version');
    }
    
    // Get creator info
    const creator = await db.query.users.findFirst({
      where: eq(users.id, versionData.createdBy),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
    
    const version = {
      ...versionData,
      creator: creator || null,
    };

    return successResponse(version);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

