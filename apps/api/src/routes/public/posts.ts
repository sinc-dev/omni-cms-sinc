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
  postTypeFields,
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
    const fieldsParam = url.searchParams.get('fields') ?? undefined;

    // Parse fields parameter
    const requestedFields = fieldsParam
      ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
      : undefined;

    // Categorize requested fields
    const standardFields = new Set<string>();
    const authorFields = new Set<string>();
    const postTypeFields = new Set<string>();
    const customFieldSlugs = new Set<string>();
    let includeTaxonomies = false;
    let includeFeaturedImage = false;

    if (requestedFields) {
      for (const field of requestedFields) {
        if (field.startsWith('customFields.')) {
          const slug = field.replace('customFields.', '');
          customFieldSlugs.add(slug);
        } else if (field.startsWith('author.')) {
          const subField = field.replace('author.', '');
          authorFields.add(subField);
        } else if (field.startsWith('postType.')) {
          const subField = field.replace('postType.', '');
          postTypeFields.add(subField);
        } else if (field === 'taxonomies') {
          includeTaxonomies = true;
        } else if (field === 'featuredImage') {
          includeFeaturedImage = true;
        } else {
          // Standard field
          standardFields.add(field);
        }
      }
      // Always include id for identification
      standardFields.add('id');
    }

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
    // Note: We fetch all columns and filter in response to ensure we have all necessary IDs for relations
    const allPosts = await db.query.posts.findMany({
      where: (p, { and: andFn }) => andFn(...conditions),
      limit: perPage,
      offset,
      orderBy,
      with: {
        author: (!requestedFields || authorFields.size > 0) ? {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        } : undefined,
        postType: (!requestedFields || postTypeFields.size > 0) ? {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        } : undefined,
      },
    });

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...conditions));
    const total = Number(totalResult[0]?.count || 0);

    // Collect unique post type IDs from fetched posts
    const postTypeIds = Array.from(new Set(allPosts.map(p => p.postTypeId).filter(Boolean)));

    // Batch fetch post_type_fields for all post types (to filter custom fields)
    const allPostTypeFields = postTypeIds.length > 0
      ? await db.query.postTypeFields.findMany({
          where: (ptf, { inArray }) => inArray(ptf.postTypeId, postTypeIds),
          orderBy: (ptf, { asc }) => [asc(ptf.order)],
        })
      : [];

    // Create map: postTypeId -> Set of allowed custom field IDs
    const postTypeFieldsMap = new Map<string, Set<string>>();
    const customFieldOrderMap = new Map<string, number>();

    for (const ptf of allPostTypeFields) {
      if (!postTypeFieldsMap.has(ptf.postTypeId)) {
        postTypeFieldsMap.set(ptf.postTypeId, new Set());
      }
      postTypeFieldsMap.get(ptf.postTypeId)!.add(ptf.customFieldId);
      customFieldOrderMap.set(ptf.customFieldId, ptf.order);
    }

    // Fetch taxonomies, custom fields, featured images, and format data for each post
    const postsWithRelations = await Promise.all(
      allPosts.map(async (post) => {
        const result: any = {};

        // Add standard fields
        if (!requestedFields || standardFields.has('id')) result.id = post.id;
        if (!requestedFields || standardFields.has('title')) result.title = post.title;
        if (!requestedFields || standardFields.has('slug')) result.slug = post.slug;
        if (!requestedFields || standardFields.has('excerpt')) result.excerpt = post.excerpt;
        if (!requestedFields || standardFields.has('content')) result.content = post.content;
        if (!requestedFields || standardFields.has('status')) result.status = post.status;
        if (!requestedFields || standardFields.has('publishedAt')) {
          result.publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null;
        }
        if (!requestedFields || standardFields.has('updatedAt')) {
          result.updatedAt = post.updatedAt ? new Date(post.updatedAt).toISOString() : null;
        }
        if (!requestedFields || standardFields.has('createdAt')) {
          result.createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null;
        }

        // Add author if requested or if not filtering fields
        if ((!requestedFields || authorFields.size > 0) && post.author) {
          result.author = {};
          if (!requestedFields || authorFields.has('id')) result.author.id = post.author.id;
          if (!requestedFields || authorFields.has('name')) result.author.name = post.author.name;
          if (!requestedFields || authorFields.has('email')) result.author.email = post.author.email;
          if (!requestedFields || authorFields.has('avatarUrl')) result.author.avatarUrl = post.author.avatarUrl || null;
        }

        // Add postType if requested or if not filtering fields
        if ((!requestedFields || postTypeFields.size > 0) && post.postType) {
          result.postType = {};
          if (!requestedFields || postTypeFields.has('id')) result.postType.id = post.postType.id;
          if (!requestedFields || postTypeFields.has('name')) result.postType.name = post.postType.name;
          if (!requestedFields || postTypeFields.has('slug')) result.postType.slug = post.postType.slug;
        }

        // Fetch taxonomies if requested
        if (!requestedFields || includeTaxonomies) {
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
          result.taxonomies = taxonomiesBySlug;
        }

        // Fetch custom fields if requested
        if (!requestedFields || customFieldSlugs.size > 0) {
          const fieldValuesData = await db.query.postFieldValues.findMany({
            where: (pfv, { eq }) => eq(pfv.postId, post.id),
          });

          // Get allowed custom field IDs for this post's post type
          const allowedCustomFieldIds = post.postTypeId 
            ? postTypeFieldsMap.get(post.postTypeId) || new Set<string>()
            : new Set<string>();

          if (allowedCustomFieldIds.size === 0 && post.postTypeId) {
            console.log(`[DEBUG] No custom fields attached to post type ${post.postTypeId} for post ${post.id}`);
          }

          if (fieldValuesData.length === 0) {
            console.log(`[DEBUG] No field values found for post ${post.id} (${post.slug})`);
          }

          // Filter to only include values for custom fields attached to this post type
          const filteredFieldValues = fieldValuesData.filter(fv => allowedCustomFieldIds.has(fv.customFieldId));

          if (filteredFieldValues.length === 0 && fieldValuesData.length > 0) {
            console.log(`[DEBUG] Field values filtered out for post ${post.id} - allowed custom field IDs: ${Array.from(allowedCustomFieldIds).join(', ')}`);
          }

          const customFieldsData = await Promise.all(
            filteredFieldValues.map(async (fv) => {
              const field = await db.query.customFields.findFirst({
                where: (cf, { eq }) => eq(cf.id, fv.customFieldId),
              });
              if (!field) return null;

              // Only include requested custom fields
              if (requestedFields && !customFieldSlugs.has(field.slug)) {
                return null;
              }

              let parsedValue: unknown = fv.value;
              try {
                // All non-text field types are stored as JSON strings
                if (['number', 'boolean', 'select', 'multi_select', 'json', 'media', 'relation'].includes(field.fieldType)) {
                  parsedValue = JSON.parse(fv.value || '{}');
                }
              } catch {
                // Keep as string if not valid JSON
              }

              // Resolve media-type custom fields to full media objects
              if (field.fieldType === 'media' && parsedValue !== null && parsedValue !== undefined && parsedValue !== '') {
                try {
                  // Handle empty array case
                  if (Array.isArray(parsedValue) && parsedValue.length === 0) {
                    parsedValue = [];
                  } else {
                    // Media field value can be a single ID (string) or array of IDs
                    const mediaIds = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                    const resolvedMedia = await Promise.all(
                      mediaIds.map(async (mediaId: string) => {
                        if (!mediaId || typeof mediaId !== 'string' || mediaId.trim() === '') return null;
                        const mediaItem = await db.query.media.findFirst({
                          where: (m, { eq }) => eq(m.id, mediaId),
                        });
                        if (!mediaItem) {
                          console.warn(`[DEBUG] Media item not found for ID: ${mediaId} in custom field ${field.slug}`);
                          return null;
                        }
                        const urls = getMediaVariantUrls(mediaItem, c.env);
                        return {
                          id: mediaItem.id,
                          ...urls,
                          altText: mediaItem.altText,
                          caption: mediaItem.caption,
                        };
                      })
                    );
                    // Filter out null values and return single object or array
                    const validMedia = resolvedMedia.filter(Boolean);
                    parsedValue = Array.isArray(parsedValue) ? validMedia : (validMedia[0] || null);
                  }
                } catch (error) {
                  console.error(`Error resolving media for custom field ${field.slug}:`, error);
                  // Keep original value if resolution fails
                }
              }

              // Resolve relation-type custom fields (post references)
              if (field.fieldType === 'relation' && parsedValue) {
                try {
                  const postIds = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                  const resolvedPosts = await Promise.all(
                    postIds.map(async (postId: string) => {
                      if (!postId || typeof postId !== 'string') return null;
                      const relatedPost = await db.query.posts.findFirst({
                        where: (p, { eq, and: andFn }) => andFn(
                          eq(p.id, postId),
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
                      return relatedPost ? {
                        id: relatedPost.id,
                        title: relatedPost.title,
                        slug: relatedPost.slug,
                        excerpt: relatedPost.excerpt,
                        publishedAt: relatedPost.publishedAt ? new Date(relatedPost.publishedAt).toISOString() : null,
                      } : null;
                    })
                  );
                  const validPosts = resolvedPosts.filter(Boolean);
                  parsedValue = Array.isArray(parsedValue) ? validPosts : (validPosts[0] || null);
                } catch (error) {
                  console.error(`Error resolving relation for custom field ${field.slug}:`, error);
                }
              }

              return {
                field: {
                  id: field.id,
                  name: field.name,
                  slug: field.slug,
                  fieldType: field.fieldType,
                },
                value: parsedValue,
                _order: customFieldOrderMap.get(fv.customFieldId) ?? 0, // Internal use for sorting only
              };
            })
          );

          // Filter out null values and sort by order
          const validCustomFieldsData = customFieldsData.filter((cf): cf is NonNullable<typeof cf> => cf !== null);
          validCustomFieldsData.sort((a, b) => (a._order || 0) - (b._order || 0));
          
          // Remove internal _order property
          const cleanedCustomFieldsData = validCustomFieldsData.map((cf) => {
            const { _order, ...rest } = cf;
            return rest;
          });

          // Group custom fields by field slug
          const customFieldsBySlug: Record<string, unknown> = {};
          cleanedCustomFieldsData.forEach((cf: any) => {
            if (cf && cf.field) {
              customFieldsBySlug[cf.field.slug] = cf.value;
            }
          });
          result.customFields = customFieldsBySlug;
          
          if (Object.keys(customFieldsBySlug).length > 0) {
            console.log(`[DEBUG] Successfully resolved ${Object.keys(customFieldsBySlug).length} custom fields for post ${post.id}`);
          }
        }

        // Fetch featured image if requested
        if ((!requestedFields || includeFeaturedImage) && post.featuredImageId) {
          const featuredMedia = await db.query.media.findFirst({
            where: (m, { eq }) => eq(m.id, post.featuredImageId!),
          });
          if (featuredMedia) {
            const urls = getMediaVariantUrls(featuredMedia, c.env);
            result.featuredImage = {
              id: featuredMedia.id,
              ...urls,
              altText: featuredMedia.altText,
              caption: featuredMedia.caption,
            };
          } else {
            result.featuredImage = null;
          }
        } else if (!requestedFields) {
          result.featuredImage = null;
        }

        return result;
      })
    );

    // Set caching headers (15 minutes for list endpoints)
    return c.json(paginatedResponse(postsWithRelations, page, perPage, total), 200, {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    });
  }
);

export default app;
