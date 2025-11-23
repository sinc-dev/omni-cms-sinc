import { eq, and, gt } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postEditLocks } from '@/db/schema/post-edit-locks';
import { nanoid } from 'nanoid';

// POST /api/admin/v1/organizations/:orgId/posts/:postId/lock/takeover
// Force takeover of lock (requires posts:update permission)
export const POST = withAuth(
  async (request, { db, user, organizationId }, params) => {
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

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

    // Find existing active lock
    const existingLock = await db.select().from(postEditLocks).where(
      and(
        eq(postEditLocks.postId, postId),
        gt(postEditLocks.expiresAt, now)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (existingLock) {
      // Delete existing lock
      await db.delete(postEditLocks).where(eq(postEditLocks.id, existingLock.id));
    }

    // Create new lock for current user
    const newLock = await db
      .insert(postEditLocks)
      .values({
        id: nanoid(),
        postId,
        userId: user.id,
        lockedAt: now,
        expiresAt,
      })
      .returning();

    return successResponse({
      lock: newLock[0],
      message: 'Lock taken over',
    });
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

