import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext, trackApiEvent } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, organizations, postTypes, users, postTaxonomies, taxonomyTerms, postFieldValues, customFields, media, postRelationships } from '../../db/schema';
import { getMediaVariantUrls } from '../../lib/media/urls';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/public/v1/:orgSlug/posts/:slug - Get a single published post by slug
app.get(
  '/:orgSlug/posts/:slug',
  publicMiddleware({ trackAnalytics: true }),
  async (c) => {
    const context = getPublicContext(c);
    const { db } = context;
    const orgSlug = c.req.param('orgSlug');
    const postSlug = c.req.param('slug');

    if (!orgSlug || !postSlug) {
      return c.json(Errors.badRequest('Organization slug and post slug required'), 400);
    }

    // Find organization by slug
    const organization = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!organization) {
      return c.json(Errors.notFound('Organization'), 404);
    }

    // Find post by slug and organization, must be published
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organization.id),
        eq(p.slug, postSlug),
        eq(p.status, 'published')
      ),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        postType: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    // Fetch taxonomies
    const postTaxonomiesData = await db.query.postTaxonomies.findMany({
      where: (pt, { eq }) => eq(pt.postId, post.id),
    });

    const taxonomyTermsData = await Promise.all(
      postTaxonomiesData.map(async (pt) => {
        const term = await db.query.taxonomyTerms.findFirst({
          where: (tt, { eq }) => eq(tt.id, pt.taxonomyTermId),
          with: {
            taxonomy: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        });
        return term;
      })
    );

    // Fetch custom field values
    const fieldValuesData = await db.query.postFieldValues.findMany({
      where: (pfv, { eq }) => eq(pfv.postId, post.id),
    });

    const customFieldsData = await Promise.all(
      fieldValuesData.map(async (fv) => {
        const field = await db.query.customFields.findFirst({
          where: (cf, { eq }) => eq(cf.id, fv.customFieldId),
        });
        if (!field) return null;

        let parsedValue: unknown = fv.value;
        try {
          parsedValue = JSON.parse(fv.value || '{}');
        } catch {
          // Keep as string if not valid JSON
        }

        return {
          field: {
            id: field.id,
            name: field.name,
            slug: field.slug,
            fieldType: field.fieldType,
          },
          value: parsedValue,
        };
      })
    );

    // Fetch featured image if present
    let featuredImage = null;
    if (post.featuredImageId) {
      const featuredMedia = await db.query.media.findFirst({
        where: (m, { eq }) => eq(m.id, post.featuredImageId!),
      });
      if (featuredMedia) {
        const urls = getMediaVariantUrls(featuredMedia);
        featuredImage = {
          id: featuredMedia.id,
          ...urls,
          altText: featuredMedia.altText,
          caption: featuredMedia.caption,
        };
      }
    }

    // Fetch related posts
    const relationships = await db.query.postRelationships.findMany({
      where: (pr, { eq }) => eq(pr.fromPostId, post.id),
    });

    const relatedPostsData = await Promise.all(
      relationships.map(async (rel) => {
        const relatedPost = await db.query.posts.findFirst({
          where: (p, { eq, and: andFn }) => andFn(
            eq(p.id, rel.toPostId),
            eq(p.status, 'published')
          ),
          columns: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
          },
        });
        if (!relatedPost) return null;
        return {
          id: relatedPost.id,
          title: relatedPost.title,
          slug: relatedPost.slug,
          excerpt: relatedPost.excerpt,
          publishedAt: relatedPost.publishedAt ? new Date(relatedPost.publishedAt).toISOString() : null,
          relationshipType: rel.relationshipType,
        };
      })
    );

    // Group taxonomies by taxonomy slug
    const taxonomiesBySlug: Record<string, any[]> = {};
    taxonomyTermsData.filter(Boolean).forEach((term: any) => {
      const taxonomySlug = term.taxonomy?.slug || 'uncategorized';
      if (!taxonomiesBySlug[taxonomySlug]) {
        taxonomiesBySlug[taxonomySlug] = [];
      }
      taxonomiesBySlug[taxonomySlug].push({
        id: term.id,
        name: term.name,
        slug: term.slug,
      });
    });

    // Track view analytics if API key is used
    if (context.apiKey) {
      await trackApiEvent(
        db,
        'api.post.viewed',
        context.apiKey.organizationId,
        context.apiKey.id,
        post.id
      );
    }

    const postWithRelations = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      author: {
        id: post.author.id,
        name: post.author.name,
        email: post.author.email,
        avatarUrl: post.author.avatarUrl || null,
      },
      postType: {
        id: post.postType.id,
        name: post.postType.name,
        slug: post.postType.slug,
      },
      featuredImage,
      taxonomies: taxonomiesBySlug,
      customFields: customFieldsData.reduce((acc: Record<string, unknown>, cf: any) => {
        if (cf && cf.field) {
          acc[cf.field.slug] = cf.value;
        }
        return acc;
      }, {} as Record<string, unknown>),
      relatedPosts: relatedPostsData.filter(Boolean),
    };

    // Set caching headers (10 minutes for individual posts)
    return c.json(successResponse(postWithRelations), 200, {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
    });
  }
);

export default app;

