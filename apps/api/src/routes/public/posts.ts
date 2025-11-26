import { Hono } from 'hono';
import { eq, and, like, or, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext } from '../../lib/api/hono-public-middleware';
import { paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset, parseDateParam, parseSortParam } from '../../lib/api/validation';
import {
  posts,
  organizations,
  postTypes,
  users,
  postTaxonomies,
  taxonomyTerms,
  taxonomies,
  postFieldValues,
  customFields,
  media,
  postRelationships,
} from '../../db/schema';
import { getMediaVariantUrls } from '../../lib/media/urls';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Helper function to parse date
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// GET /api/public/v1/:orgSlug/posts - List published posts
app.get(
  '/:orgSlug/posts',
  publicMiddleware({ trackAnalytics: true }),
  async (c) => {
    const context = getPublicContext(c);
    const { db } = context;
    const orgSlug = c.req.param('orgSlug');

    if (!orgSlug) {
      return c.json(Errors.badRequest('Organization slug required'), 400);
    }

    // Get pagination parameters
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

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

    // Get filter parameters
    const postTypeSlug = url.searchParams.get('post_type') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;
    const publishedFrom = url.searchParams.get('published_from') ?? undefined;
    const publishedTo = url.searchParams.get('published_to') ?? undefined;
    const relatedToSlug = url.searchParams.get('related_to_slug') ?? undefined;
    const relationshipType = url.searchParams.get('relationship_type') ?? undefined;
    const taxonomyFilters = url.searchParams.getAll('taxonomy'); // Can be repeated
    const authorId = url.searchParams.get('author_id') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'publishedAt_desc';

    // Build where conditions - only published posts
    const conditions: any[] = [
      eq(posts.organizationId, org.id),
      eq(posts.status, 'published'),
    ];

    // Filter by post type (supports single or comma-separated multiple)
    if (postTypeSlug) {
      const postTypeSlugs = postTypeSlug.split(',').map(s => s.trim()).filter(Boolean);
      const postTypeIds: string[] = [];

      for (const slug of postTypeSlugs) {
      const postTypeRecord = await db.query.postTypes.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, org.id),
            eq(pt.slug, slug)
          ),
        });
        if (postTypeRecord) {
          postTypeIds.push(postTypeRecord.id);
        }
      }

      if (postTypeIds.length === 0) {
        // No valid post types found - return empty result
        return c.json(paginatedResponse([], page, perPage, 0), 200, {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        });
      }

      if (postTypeIds.length === 1) {
        conditions.push(eq(posts.postTypeId, postTypeIds[0]));
      } else {
        conditions.push(inArray(posts.postTypeId, postTypeIds));
      }
    }

    // Filter by relationship (e.g., get programs related to a university)
    let relatedPostIds: string[] = [];
    if (relatedToSlug) {
      // Find the post(s) with the given slug
      const relatedPosts = await db.query.posts.findMany({
        where: (p, { eq, and: andFn }) => andFn(
          eq(p.organizationId, org.id),
          eq(p.slug, relatedToSlug),
          eq(p.status, 'published')
        ),
      });

      if (relatedPosts.length === 0) {
        // Related post not found - return empty result
        return c.json(paginatedResponse([], page, perPage, 0), 200, {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        });
      }

      relatedPostIds = relatedPosts.map(p => p.id);

      // Find all posts that have a relationship to the related post(s)
      let relatedPostIds_filter: string[] = [];
      if (relationshipType) {
        // Filter by specific relationship type (e.g., 'university')
        const relationships = await db.query.postRelationships.findMany({
          where: (pr, { eq, and: andFn, inArray }) => andFn(
            inArray(pr.toPostId, relatedPostIds),
            eq(pr.relationshipType, relationshipType)
          ),
        });
        relatedPostIds_filter = relationships.map(r => r.fromPostId);
      } else {
        // Get all relationships regardless of type
        const relationships = await db.query.postRelationships.findMany({
          where: (pr, { inArray }) => inArray(pr.toPostId, relatedPostIds),
        });
        relatedPostIds_filter = relationships.map(r => r.fromPostId);
      }

      if (relatedPostIds_filter.length > 0) {
        conditions.push(inArray(posts.id, relatedPostIds_filter));
      } else {
        // No relationships found - return empty result
        return c.json(paginatedResponse([], page, perPage, 0), 200, {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        });
      }
    }

    // Filter by taxonomy terms (e.g., taxonomy=program-degree-level:bachelor)
    if (taxonomyFilters.length > 0) {
      const taxonomyPostIds: string[][] = [];

      for (const taxonomyFilter of taxonomyFilters) {
        const [taxonomySlug, termSlug] = taxonomyFilter.split(':');
        
        if (!taxonomySlug || !termSlug) {
          // Invalid format - skip this filter
          continue;
        }

        // Find taxonomy by slug
        const taxonomy = await db.query.taxonomies.findFirst({
          where: (t, { eq, and: andFn }) => andFn(
            eq(t.organizationId, org.id),
            eq(t.slug, taxonomySlug)
          ),
        });

        if (!taxonomy) {
          // Taxonomy not found - return empty result
          return c.json(paginatedResponse([], page, perPage, 0), 200, {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          });
        }

        // Find term by slug
        const term = await db.query.taxonomyTerms.findFirst({
          where: (tt, { eq, and: andFn }) => andFn(
            eq(tt.taxonomyId, taxonomy.id),
            eq(tt.slug, termSlug)
          ),
        });

        if (!term) {
          // Term not found - return empty result
          return c.json(paginatedResponse([], page, perPage, 0), 200, {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          });
        }

        // Find all posts with this taxonomy term
        const postIdsWithTerm = await db.query.postTaxonomies.findMany({
          where: (pt, { eq }) => eq(pt.taxonomyTermId, term.id),
          columns: {
            postId: true,
          },
        });

        const postIds = postIdsWithTerm.map((p) => p.postId);
        
        if (postIds.length === 0) {
          // No posts with this term - return empty result
          return c.json(paginatedResponse([], page, perPage, 0), 200, {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          });
        }

        taxonomyPostIds.push(postIds);
      }

      // If we have taxonomy filters, posts must be in ALL of the term sets (AND logic)
      if (taxonomyPostIds.length > 0) {
        // Find intersection of all post ID sets
        let intersectionIds = taxonomyPostIds[0];
        for (let i = 1; i < taxonomyPostIds.length; i++) {
          intersectionIds = intersectionIds.filter(id => taxonomyPostIds[i].includes(id));
        }

        if (intersectionIds.length === 0) {
          // No posts match all taxonomy filters - return empty result
          return c.json(paginatedResponse([], page, perPage, 0), 200, {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          });
        }

        conditions.push(inArray(posts.id, intersectionIds));
      }
    }

    // Filter by author
    if (authorId) {
      const author = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, authorId),
      });

      if (!author) {
        // Author not found - return empty result
        return c.json(paginatedResponse([], page, perPage, 0), 200, {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        });
      }

      conditions.push(eq(posts.authorId, author.id));
    }

    // Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(posts.title, searchTerm),
          like(posts.content, searchTerm),
          like(posts.excerpt, searchTerm)
        )!
      );
    }

    // Date range filters
    if (publishedFrom) {
      const fromDate = parseDate(publishedFrom);
      if (!fromDate) {
        return c.json(Errors.badRequest('Invalid published_from date format. Use ISO 8601 format (e.g., 2024-01-01T00:00:00Z)'), 400);
      }
      conditions.push(gte(posts.publishedAt, fromDate));
    }

    if (publishedTo) {
      const toDate = parseDate(publishedTo);
      if (!toDate) {
        return c.json(Errors.badRequest('Invalid published_to date format. Use ISO 8601 format (e.g., 2024-12-31T23:59:59Z)'), 400);
      }
      conditions.push(lte(posts.publishedAt, toDate));
    }

    // Parse sort configuration
    const sortConfig = parseSortParam(sort, {
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      title: posts.title,
    }, 'publishedAt', 'desc');
    
    // Build orderBy based on sort config
    let orderBy: any[];
    if (sortConfig[0] && typeof sortConfig[0] === 'object') {
      orderBy = sortConfig;
    } else {
      // Fallback to default
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

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);

    // Fetch taxonomies, custom fields, featured images, and format data for each post
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
            const urls = getMediaVariantUrls(featuredMedia, c.env);
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

        // Group custom fields by field slug
        const customFieldsBySlug: Record<string, unknown> = {};
        customFieldsData.filter(Boolean).forEach((cf: any) => {
          if (cf && cf.field) {
            customFieldsBySlug[cf.field.slug] = cf.value;
          }
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
          customFields: customFieldsBySlug,
        };
      })
    );

    // Set caching headers (15 minutes for list endpoints)
    return c.json(paginatedResponse(postsWithRelations, page, perPage, total), 200, {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    });
  }
);

export default app;
