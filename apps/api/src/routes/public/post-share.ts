import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext, trackApiEvent } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, organizations, postShares } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const sharePostSchema = z.object({
  shareType: z.enum(['facebook', 'twitter', 'linkedin', 'email', 'link', 'other']),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

// POST /api/public/v1/:orgSlug/posts/:slug/share
// Record a share event for a post
app.post(
  '/:orgSlug/posts/:slug/share',
  publicMiddleware({ trackAnalytics: true }),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    const postSlug = c.req.param('slug');

    if (!orgSlug || !postSlug) {
      return c.json(Errors.badRequest('Organization slug and post slug required'), 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = sharePostSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(Errors.validationError(validation.error.issues), 400);
    }

    // Find organization
    const organization = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!organization) {
      return c.json(Errors.notFound('Organization'), 404);
    }

    // Find post
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organization.id),
        eq(p.slug, postSlug),
        eq(p.status, 'published')
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    // Record share
    const share = await db
      .insert(postShares)
      .values({
        id: nanoid(),
        postId: post.id,
        shareType: validation.data.shareType,
        metadata: validation.data.metadata ? JSON.stringify(validation.data.metadata) : null,
        createdAt: new Date(),
      })
      .returning();

    // Increment share count on post
    await db
      .update(posts)
      .set({
        shareCount: (post.shareCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id));

    return c.json(successResponse({
      id: share[0].id,
      shareType: share[0].shareType,
      createdAt: share[0].createdAt,
    }));
  }
);

export default app;

