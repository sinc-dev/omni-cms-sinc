import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, organizations } from '../../db/schema';
import { invalidatePostCache } from '../../lib/cache/invalidation';
import { dispatchWebhook } from '../../lib/webhooks/webhook-dispatcher';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/admin/v1/organizations/:orgId/posts/:postId/publish
app.post(
  '/:orgId/posts/:postId/publish',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:publish'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    const updated = await db
      .update(posts)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Post'), 404);
    }

    const updatedResult = updatedArray[0];
    
    // Invalidate cache when post is published
    try {
      await invalidatePostCache(organizationId!, updatedResult.slug, db);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }

    // Dispatch webhook event
    try {
      await dispatchWebhook(db, organizationId!, {
        event: 'post.published',
        data: {
          postId: updatedResult.id,
          title: updatedResult.title,
          slug: updatedResult.slug,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to dispatch webhook:', error);
    }
    
    return c.json(successResponse(updatedResult));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/posts/:postId/publish (Unpublish)
app.delete(
  '/:orgId/posts/:postId/publish',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:publish'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    const updated = await db
      .update(posts)
      .set({
        status: 'draft',
        publishedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('Post'), 404);
    }

    const updatedResult = updatedArray[0];
    
    // Invalidate cache when post is unpublished
    try {
      await invalidatePostCache(organizationId!, updatedResult.slug, db);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }

    // Dispatch webhook event
    try {
      await dispatchWebhook(db, organizationId!, {
        event: 'post.unpublished',
        data: {
          postId: updatedResult.id,
          title: updatedResult.title,
          slug: updatedResult.slug,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to dispatch webhook:', error);
    }
    
    return c.json(successResponse(updatedResult));
  }
);

export default app;

