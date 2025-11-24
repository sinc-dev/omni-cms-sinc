import { Hono } from 'hono';
import { eq, and, like, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { paginatedResponse, Errors } from '../../lib/api/hono-response';
import {
  posts,
  organizations,
  postTypes,
  users,
  postTaxonomies,
  taxonomyTerms,
  taxonomies,
  media,
} from '../../db/schema';
import { getMediaVariantUrls } from '../../lib/media/urls';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Helper function to parse date
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse sort
function parseSort(sortStr: string, defaultField: string, defaultDir: 'asc' | 'desc' = 'desc') {
  const [field, dir] = sortStr.split('_');
  return {
    field: field || defaultField,
    direction: (dir === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  };
}

// GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts - List posts by taxonomy term
app.get(
  '/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts',
  publicMiddleware(),
  async (c) => {
    const { db } = getPublicContext(c);
    const orgSlug = c.req.param('orgSlug');
    const taxonomySlug = c.req.param('taxonomySlug');
    const termSlug = c.req.param('termSlug');

    if (!orgSlug || !taxonomySlug || !termSlug) {
      return c.json(Errors.badRequest('Organization slug, taxonomy slug, and term slug required'), 400);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const perPage = parseInt(c.req.query('per_page') || '20', 10);
    const offset = (page - 1) * perPage;

    // Find organization by slug
    const organization = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, orgSlug),
    });

    if (!organization) {
      return c.json(Errors.notFound('Organization'), 404);
    }

    // Find taxonomy by slug
    const taxonomy = await db.query.taxonomies.findFirst({
      where: (t, { eq, and: andFn }) => andFn(
        eq(t.organizationId, organization.id),
        eq(t.slug, taxonomySlug)
      ),
    });

    if (!taxonomy) {
      return c.json(Errors.notFound('Taxonomy'), 404);
    }

    // Find term by slug
    const term = await db.query.taxonomyTerms.findFirst({
      where: (tt, { eq, and: andFn }) => andFn(
        eq(tt.taxonomyId, taxonomy.id),
        eq(tt.slug, termSlug)
      ),
    });

    if (!term) {
      return c.json(Errors.notFound('Term'), 404);
    }

    // Get filter parameters
    const postType = c.req.query('post_type');
    const search = c.req.query('search');
    const publishedFrom = c.req.query('published_from');
    const publishedTo = c.req.query('published_to');
    const sort = c.req.query('sort') || 'publishedAt_desc';

    // Find all posts with this taxonomy term
    const postIdsWithTerm = await db.query.postTaxonomies.findMany({
      where: (pt, { eq }) => eq(pt.taxonomyTermId, term.id),
      columns: {
        postId: true,
      },
    });

    const postIds = postIdsWithTerm.map((p) => p.postId);

    if (postIds.length === 0) {
      return c.json(paginatedResponse([], page, perPage, 0), 200, {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      });
    }

    // Build where conditions - only published posts
    const conditions: any[] = [
      eq(posts.organizationId, organization.id),
      eq(posts.status, 'published'),
      inArray(posts.id, postIds),
    ];

    if (postType) {
      const postTypeRecord = await db.query.postTypes.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, organization.id),
          eq(pt.slug, postType)
        ),
      });
      if (postTypeRecord) {
        conditions.push(eq(posts.postTypeId, postTypeRecord.id));
      }
    }

    if (search) {
      conditions.push(like(posts.title, `%${search}%`));
    }

    // Date range filters
    if (publishedFrom) {
      const fromDate = parseDate(publishedFrom);
      if (!fromDate) {
        return c.json(Errors.badRequest('Invalid published_from date format'), 400);
      }
      conditions.push(gte(posts.publishedAt, fromDate));
    }

    if (publishedTo) {
      const toDate = parseDate(publishedTo);
      if (!toDate) {
        return c.json(Errors.badRequest('Invalid published_to date format'), 400);
      }
      conditions.push(lte(posts.publishedAt, toDate));
    }

    // Parse sort configuration
    const sortConfig = parseSort(sort, 'publishedAt', 'desc');
    
    // Build orderBy based on sort config
    let orderBy: any[];
    if (sortConfig.field === 'publishedAt') {
      orderBy = sortConfig.direction === 'asc' ? [asc(posts.publishedAt)] : [desc(posts.publishedAt)];
    } else if (sortConfig.field === 'createdAt') {
      orderBy = sortConfig.direction === 'asc' ? [asc(posts.createdAt)] : [desc(posts.createdAt)];
    } else if (sortConfig.field === 'updatedAt') {
      orderBy = sortConfig.direction === 'asc' ? [asc(posts.updatedAt)] : [desc(posts.updatedAt)];
    } else if (sortConfig.field === 'title') {
      orderBy = sortConfig.direction === 'asc' ? [asc(posts.title)] : [desc(posts.title)];
    } else {
      orderBy = [desc(posts.publishedAt)];
    }

    // Fetch posts with relations
    const allPosts = await db.query.posts.findMany({
      where: (p, { and: andFn }) => andFn(...conditions),
      limit: perPage,
      offset,
      orderBy,
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

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);

    // Fetch taxonomies, featured images, and format data for each post
    const postsWithRelations = await Promise.all(
      allPosts.map(async (post) => {
        // Fetch taxonomies
        const postTaxonomiesData = await db.query.postTaxonomies.findMany({
          where: (pt, { eq }) => eq(pt.postId, post.id),
        });

        const taxonomyTermsData = await Promise.all(
          postTaxonomiesData.map(async (pt) => {
            const termData = await db.query.taxonomyTerms.findFirst({
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
            return termData;
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

        return {
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
        };
      })
    );

    return c.json(paginatedResponse(postsWithRelations, page, perPage, total), 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    });
  }
);

export default app;

