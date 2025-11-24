import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, organizations, users } from '../../db/schema';
import { generateArticleStructuredData } from '../../lib/seo/structured-data';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/public/v1/:orgSlug/posts/:slug/seo
// Get SEO metadata for a post
app.get(
  '/:orgSlug/posts/:slug/seo',
  publicMiddleware(),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    const slug = c.req.param('slug');

    if (!orgSlug || !slug) {
      return c.json(Errors.badRequest('Organization slug and post slug are required'), 400);
    }

    // Get organization
    const org = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!org) {
      return c.json(Errors.notFound('Organization'), 404);
    }

    // Get post (must be published)
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, org.id),
        eq(p.slug, slug),
        eq(p.status, 'published')
      ),
    });
    
    // Get author separately
    let author: { name: string; email: string } | null = null;
    if (post) {
      const authorData = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, post.authorId),
      });
      if (authorData) {
        author = {
          name: authorData.name,
          email: authorData.email,
        };
      }
    }

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    // Build SEO metadata
    const baseUrl = process.env.APP_URL || c.req.url.split('/api')[0];
    const postUrl = `${baseUrl}/${orgSlug}/posts/${slug}`;

    const seoData = {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      keywords: post.metaKeywords?.split(',').map((k: string) => k.trim()) || [],
      canonicalUrl: post.canonicalUrl || postUrl,
      ogImage: post.ogImageId
        ? `${baseUrl}/api/public/v1/${orgSlug}/media/${post.ogImageId}`
        : null,
      structuredData: post.structuredData
        ? JSON.parse(post.structuredData)
        : generateArticleStructuredData({
            title: post.title,
            description: post.metaDescription || post.excerpt || undefined,
            url: postUrl,
            author: author
              ? {
                  name: author.name || author.email,
                }
              : null,
            publishedAt: post.publishedAt || undefined,
            modifiedAt: post.updatedAt || undefined,
          }),
    };

    return c.json(successResponse(seoData));
  }
);

export default app;

