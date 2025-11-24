import { Hono } from 'hono';
import { eq, and, gt } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postEditLocks, users } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Check lock status
app.get(
  '/:orgId/posts/:postId/lock',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    // Find active lock (not expired)
    const now = new Date();
    const activeLock = await db.query.postEditLocks.findFirst({
      where: (pl, { eq, and: andFn, gt: gtFn }) => andFn(
        eq(pl.postId, postId),
        gtFn(pl.expiresAt, now)
      ),
    });

    if (!activeLock) {
      return c.json(successResponse({ locked: false, lock: null }));
    }

    // Get user info separately
    const lockUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, activeLock.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Check if current user owns the lock
    const isOwner = activeLock.userId === user.id;

    return c.json(successResponse({
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
    }));
  }
);

// POST /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Acquire or refresh lock
app.post(
  '/:orgId/posts/:postId/lock',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

    // Check for existing active lock
    const existingLock = await db.query.postEditLocks.findFirst({
      where: (pl, { eq, and: andFn, gt: gtFn }) => andFn(
        eq(pl.postId, postId),
        gtFn(pl.expiresAt, now)
      ),
    });

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

        return c.json(successResponse({
          lock: updated[0],
          message: 'Lock refreshed',
        }));
      } else {
        // Another user has the lock
        const lockUser = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, existingLock.userId),
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });

        return c.json(Errors.conflict(
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
        ), 409);
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

    return c.json(successResponse({
      lock: newLock[0],
      message: 'Lock acquired',
    }));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/posts/:postId/lock
// Release lock
app.delete(
  '/:orgId/posts/:postId/lock',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    // Find active lock
    const now = new Date();
    const lock = await db.query.postEditLocks.findFirst({
      where: (pl, { eq, and: andFn, gt: gtFn }) => andFn(
        eq(pl.postId, postId),
        gtFn(pl.expiresAt, now)
      ),
    });

    if (!lock) {
      return c.json(successResponse({ message: 'No active lock found' }));
    }

    // Only lock owner or admin can release
    if (lock.userId !== user.id) {
      // Check if user has admin permissions (would need permission check)
      // For now, only owner can release
      return c.json(Errors.forbidden(), 403);
    }

    await db.delete(postEditLocks).where(eq(postEditLocks.id, lock.id));

    return c.json(successResponse({ message: 'Lock released' }));
  }
);

// POST /api/admin/v1/organizations/:orgId/posts/:postId/lock/takeover
// Force takeover of lock (requires posts:update permission)
app.post(
  '/:orgId/posts/:postId/lock/takeover',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes

    // Find existing active lock
    const existingLock = await db.query.postEditLocks.findFirst({
      where: (pl, { eq, and: andFn, gt: gtFn }) => andFn(
        eq(pl.postId, postId),
        gtFn(pl.expiresAt, now)
      ),
    });

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

    return c.json(successResponse({
      lock: newLock[0],
      message: 'Lock taken over',
    }));
  }
);

export default app;

