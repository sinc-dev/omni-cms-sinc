import { eq, and } from 'drizzle-orm';
import { withPublic } from '@/lib/api/public-wrapper';
import { Errors } from '@/lib/api/response';
import { posts, organizations, postTypes } from '@/db/schema';

// GET /api/public/v1/:orgSlug/sitemap.xml - Generate XML sitemap for published posts
export const GET = withPublic(
  async (request, { db }, params) => {
    const orgSlug = params?.orgSlug;
    if (!orgSlug) {
      return Errors.badRequest('Organization slug required');
    }

    const url = new URL(request.url);
    const baseUrl = url.origin; // Or use NEXT_PUBLIC_APP_URL if configured

    // Find organization by slug
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!organization) {
      return Errors.notFound('Organization');
    }

    // Fetch all published posts for this organization
    const allPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.organizationId, organization.id),
        eq(posts.status, 'published')
      ),
      with: {
        postType: {
          columns: {
            slug: true,
          },
        },
      },
      orderBy: (posts, { desc }) => [desc(posts.publishedAt)],
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
    
    // Build post URL - adjust path structure based on your Next.js project needs
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
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    headers.set('Content-Type', 'application/xml; charset=utf-8');

    return new Response(sitemap, {
      status: 200,
      headers: Object.fromEntries(headers),
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

