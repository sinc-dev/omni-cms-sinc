import { eq, and, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postEditLocks } from '@/db/schema/post-edit-locks';
import { users } from '@/db/schema/users';

// GET /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Check lock status
export const GET = withAuth(
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

    // Find active lock (not expired)
    const now = new Date();
    const activeLock = await db.select().from(postEditLocks).where(
      and(
        eq(postEditLocks.postId, postId),
        gt(postEditLocks.expiresAt, now)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!activeLock) {
      return successResponse({ locked: false, lock: null });
    }

    // Get user info separately
    const lockUser = await db.query.users.findFirst({
      where: eq(users.id, activeLock.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Check if current user owns the lock
    const isOwner = activeLock.userId === user.id;

    return successResponse({
      locked: true,
      lock: {
        id: activeLock.id,
        userId: activeLock.userId,
        userName: lockUser?.name || lockUser?.email || 'Unknown',
        userAvatar: lockUser?.avatarUrl,
        lockedAt: activeLock.lockedAt,
        expiresAt: activeLock.expiresAt,
        isOwner,
      },
    });
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Acquire or refresh lock
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

    // Check for existing active lock
    const existingLock = await db.select().from(postEditLocks).where(
      and(
        eq(postEditLocks.postId, postId),
        gt(postEditLocks.expiresAt, now)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (existingLock) {
      // If current user owns the lock, refresh it
      if (existingLock.userId === user.id) {
        const updated = await db
          .update(postEditLocks)
          .set({
            expiresAt,
            lockedAt: now, // Refresh lock time
          })
          .where(eq(postEditLocks.id, existingLock.id))
          .returning();

        return successResponse({
          lock: updated[0],
          message: 'Lock refreshed',
        });
      } else {
        // Another user has the lock
        const lockUser = await db.query.users.findFirst({
          where: eq(users.id, existingLock.userId),
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });

        return Errors.conflict(
          'Post is currently being edited by another user',
          {
            lock: {
              userId: existingLock.userId,
              userName: lockUser?.name || lockUser?.email || 'Unknown',
              userAvatar: lockUser?.avatarUrl,
              lockedAt: existingLock.lockedAt,
              expiresAt: existingLock.expiresAt,
            },
          }
        );
      }
    }

    // Create new lock
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
      message: 'Lock acquired',
    });
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Release lock
export const DELETE = withAuth(
  async (request, { db, user, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    // Find active lock
    const now = new Date();
    const lock = await db.select().from(postEditLocks).where(
      and(
        eq(postEditLocks.postId, postId),
        gt(postEditLocks.expiresAt, now)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!lock) {
      return successResponse({ message: 'No active lock found' });
    }

    // Only lock owner or admin can release
    if (lock.userId !== user.id) {
      // Check if user has admin permissions (would need permission check)
      // For now, only owner can release
      return Errors.forbidden();
    }

    await db.delete(postEditLocks).where(eq(postEditLocks.id, lock.id));

    return successResponse({ message: 'Lock released' });
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

