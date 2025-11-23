import { eq, and } from 'drizzle-orm';
import { withPublic } from '@/lib/api/public-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { organizations } from '@/db/schema/organizations';
import { users } from '@/db/schema/users';
import { generateArticleStructuredData } from '@/lib/seo/structured-data';

export const runtime = 'edge';

// GET /api/public/v1/:orgSlug/posts/:slug/seo
// Get SEO metadata for a post
export const GET = withPublic(
  async (request: Request, { db }, params?: Record<string, string>) => {
    const orgSlug = params?.orgSlug;
    const slug = params?.slug;

    if (!orgSlug || !slug) {
      return Errors.badRequest('Organization slug and post slug are required');
    }

    // Get organization
    const org = await db.select().from(organizations).where(
      eq(organizations.slug, orgSlug)
    ).limit(1).then(rows => rows[0] || null);

    if (!org) {
      return Errors.notFound('Organization');
    }

    // Get post (must be published)
    const post = await db.select().from(posts).where(
      and(
        eq(posts.organizationId, org.id),
        eq(posts.slug, slug),
        eq(posts.status, 'published')
      )
    ).limit(1).then(rows => rows[0] || null);
    
    // Get author separately
    let author: { name: string; email: string } | null = null;
    if (post) {
      const authorData = await db.select().from(users).where(
        eq(users.id, post.authorId)
      ).limit(1).then(rows => rows[0] || null);
      if (authorData) {
        author = {
          name: authorData.name,
          email: authorData.email,
        };
      }
    }

    if (!post) {
      return Errors.notFound('Post');
    }

    // Build SEO metadata
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
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

    return successResponse(seoData);
  }
);

