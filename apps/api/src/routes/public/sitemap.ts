import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { Errors } from '../../lib/api/hono-response';
import { posts, organizations, postTypes } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/public/v1/:orgSlug/sitemap.xml - Generate XML sitemap for published posts
app.get(
  '/:orgSlug/sitemap.xml',
  publicMiddleware(),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    
    if (!orgSlug) {
      return c.text(Errors.badRequest('Organization slug required').error.message, 400, {
        'Content-Type': 'text/plain',
      });
    }

    const url = new URL(c.req.url);
    const baseUrl = url.origin; // Or use APP_URL env var if configured

    // Find organization by slug
    const organization = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!organization) {
      return c.text(Errors.notFound('Organization').error.message, 404, {
        'Content-Type': 'text/plain',
      });
    }

    // Fetch all published posts for this organization
    const allPosts = await db.query.posts.findMany({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organization.id),
        eq(p.status, 'published')
      ),
      with: {
        postType: {
          columns: {
            slug: true,
          },
        },
      },
      orderBy: [desc(posts.publishedAt)],
    });

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPosts
  .map((post: any) => {
    if (!post.publishedAt) return '';
    
    const lastmod = new Date(post.publishedAt).toISOString().split('T')[0];
    const updatedmod = post.updatedAt 
      ? new Date(post.updatedAt).toISOString().split('T')[0]
      : lastmod;
    
    // Build post URL - adjust path structure based on your frontend routing
    // Example: /blog/{slug} or /{postType}/{slug}
    const postPath = post.postType?.slug 
      ? `/${post.postType.slug}/${post.slug}`
      : `/posts/${post.slug}`;
    const loc = `${baseUrl}${postPath}`.replace(/\/+/g, '/');

    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(updatedmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  })
  .filter(Boolean)
  .join('\n')}
</urlset>`;

    // Set caching headers (15 minutes)
    return c.text(sitemap, 200, {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      'Content-Type': 'application/xml; charset=utf-8',
    });
  }
);

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default app;

