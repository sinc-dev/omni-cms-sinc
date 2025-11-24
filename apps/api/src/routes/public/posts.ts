import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/public/v1/:orgSlug/posts - List published posts
app.get(
  '/:orgSlug/posts',
  publicMiddleware({ trackAnalytics: true }),
  async (c) => {
    const context = getPublicContext(c);
    const { db } = context;
    const orgSlug = c.req.param('orgSlug');

    // Get organization by slug (public routes don't require API key)
    const org = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.slug, orgSlug),
    });

    if (!org) {
      return c.json(Errors.notFound('Organization'), 404);
    }
    
    // If API key is provided, verify it matches the organization
    if (context.apiKey && context.apiKey.organizationId !== org.id) {
      return c.json(Errors.forbidden(), 403);
    }

    // Get published posts
    const publishedPosts = await db.query.posts.findMany({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, org.id),
        eq(p.status, 'published')
      ),
      with: {
        author: true,
        postType: true,
      },
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
      limit: 50,
    });

    return c.json(successResponse(publishedPosts));
  }
);

export default app;

