import { eq, and, gt, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { presence } from '@/db/schema/presence';
import { users } from '@/db/schema/users';

// POST /api/admin/v1/organizations/:orgId/posts/:postId/presence
// Update user presence (heartbeat)
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

    // Check if presence record exists
    const existing = await db.select().from(presence).where(
      and(
        eq(presence.postId, postId),
        eq(presence.userId, user.id)
      )
    ).limit(1).then(rows => rows[0] || null);

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
        const existingRecord = await db.select().from(presence).where(
          and(
            eq(presence.postId, postId),
            eq(presence.userId, user.id)
          )
        ).limit(1).then(rows => rows[0] || null);
        
        if (existingRecord) {
          await db
            .update(presence)
            .set({ lastSeenAt: now })
            .where(eq(presence.id, existingRecord.id));
        }
      }
    }

    return successResponse({ message: 'Presence updated' });
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// GET /api/admin/v1/organizations/:orgId/posts/:postId/presence
// Get active users (users seen in last 2 minutes)
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

    // Get active users (seen in last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const activePresence = await db.select().from(presence).where(
      and(
        eq(presence.postId, postId),
        gt(presence.lastSeenAt, twoMinutesAgo)
      )
    ).orderBy(desc(presence.lastSeenAt));
    
    // Get user info for each presence record
    const activeUsers = await Promise.all(
      activePresence.map(async (p) => {
        const userInfo = await db.query.users.findFirst({
          where: eq(users.id, p.userId),
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

    return successResponse({ activeUsers });
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

