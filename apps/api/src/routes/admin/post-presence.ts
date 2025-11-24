import { Hono } from 'hono';
import { eq, and, gt, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, presence, users } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/admin/v1/organizations/:orgId/posts/:postId/presence
// Update user presence (heartbeat)
app.post(
  '/:orgId/posts/:postId/presence',
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

    const now = new Date();

    // Check if presence record exists
    const existing = await db.query.presence.findFirst({
      where: (pr, { eq, and: andFn }) => andFn(
        eq(pr.postId, postId),
        eq(pr.userId, user.id)
      ),
    });

    if (existing) {
      // Update last seen
      await db
        .update(presence)
        .set({ lastSeenAt: now })
        .where(eq(presence.id, existing.id));
    } else {
      // Create new presence record (or update if unique constraint violation)
      try {
        await db.insert(presence).values({
          id: nanoid(),
          postId,
          userId: user.id,
          lastSeenAt: now,
        });
      } catch (error) {
        // If unique constraint violation, update instead
        const existingRecord = await db.query.presence.findFirst({
          where: (pr, { eq, and: andFn }) => andFn(
            eq(pr.postId, postId),
            eq(pr.userId, user.id)
          ),
        });
        
        if (existingRecord) {
          await db
            .update(presence)
            .set({ lastSeenAt: now })
            .where(eq(presence.id, existingRecord.id));
        }
      }
    }

    return c.json(successResponse({ message: 'Presence updated' }));
  }
);

// GET /api/admin/v1/organizations/:orgId/posts/:postId/presence
// Get active users (users seen in last 2 minutes)
app.get(
  '/:orgId/posts/:postId/presence',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
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

    // Get active users (seen in last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const activePresence = await db.query.presence.findMany({
      where: (pr, { eq, and: andFn, gt: gtFn }) => andFn(
        eq(pr.postId, postId),
        gtFn(pr.lastSeenAt, twoMinutesAgo)
      ),
      orderBy: [desc(presence.lastSeenAt)],
    });
    
    // Get user info for each presence record
    const activeUsers = await Promise.all(
      activePresence.map(async (p) => {
        const userInfo = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, p.userId),
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });
        return {
          id: userInfo?.id || p.userId,
          name: userInfo?.name,
          email: userInfo?.email,
          avatarUrl: userInfo?.avatarUrl,
          lastSeenAt: p.lastSeenAt,
        };
      })
    );

    return c.json(successResponse({ activeUsers }));
  }
);

export default app;

