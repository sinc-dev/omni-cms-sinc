import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { publicMiddleware, getPublicContext, trackApiEvent } from '../../lib/api/hono-public-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, organizations, postTypes, users, postTaxonomies, taxonomyTerms, postFieldValues, customFields, media, postRelationships, postTypeFields } from '../../db/schema';
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
    const fieldsParam = c.req.query('fields') ?? undefined;

    if (!orgSlug || !postSlug) {
      return c.json(Errors.badRequest('Organization slug and post slug required'), 400);
    }

    // Parse fields parameter
    const requestedFields = fieldsParam
      ? fieldsParam.split(',').map(f => f.trim()).filter(Boolean)
      : undefined;

    // Categorize requested fields
    const standardFields = new Set<string>();
    const authorFields = new Set<string>();
    const postTypeFieldsSet = new Set<string>();
    const customFieldSlugs = new Set<string>();
    let includeTaxonomies = false;
    let includeFeaturedImage = false;
    let includeRelatedPosts = false;

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
          postTypeFieldsSet.add(subField);
        } else if (field === 'taxonomies') {
          includeTaxonomies = true;
        } else if (field === 'featuredImage') {
          includeFeaturedImage = true;
        } else if (field === 'relatedPosts') {
          includeRelatedPosts = true;
        } else {
          standardFields.add(field);
        }
      }
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

    // Increment view count atomically (handles concurrent requests)
    await db
      .update(posts)
      .set({
        viewCount: sql`${posts.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id));

    // Get custom fields attached to this post type (to filter field values)
    const postTypeFieldsList = await db.query.postTypeFields.findMany({
      where: (ptf, { eq }) => eq(ptf.postTypeId, post.postType.id),
      orderBy: (ptf, { asc }) => [asc(ptf.order)],
    });

    if (postTypeFieldsList.length === 0) {
      console.log(`[DEBUG] No custom fields attached to post type ${post.postType.id} (${post.postType.slug})`);
    }

    const allowedCustomFieldIds = new Set(postTypeFieldsList.map(ptf => ptf.customFieldId));
    const customFieldOrderMap = new Map(postTypeFieldsList.map(ptf => [ptf.customFieldId, ptf.order]));

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

    // Fetch custom field values (only for fields attached to this post type)
    const shouldIncludeCustomFields = !requestedFields || customFieldSlugs.size > 0 || requestedFields.length === 0;
    let cleanedCustomFieldsData: any[] = [];
    
    if (shouldIncludeCustomFields) {
      const fieldValuesData = await db.query.postFieldValues.findMany({
        where: (pfv, { eq }) => eq(pfv.postId, post.id),
      });

      if (fieldValuesData.length === 0) {
        console.log(`[DEBUG] No field values found for post ${post.id} (${post.slug})`);
      }

      // Filter to only include values for custom fields attached to this post type
      const filteredFieldValues = fieldValuesData.filter(fv => allowedCustomFieldIds.has(fv.customFieldId));

      if (filteredFieldValues.length === 0 && fieldValuesData.length > 0) {
        console.log(`[DEBUG] Field values filtered out for post ${post.id} - allowed custom field IDs: ${Array.from(allowedCustomFieldIds).join(', ')}`);
      }

      // If specific custom fields requested, filter by slug
      const fieldValuesToProcess = customFieldSlugs.size > 0
        ? filteredFieldValues // Will filter by slug in the Promise.all below
        : filteredFieldValues;

      const customFieldsData = await Promise.all(
        fieldValuesToProcess.map(async (fv) => {
          const field = await db.query.customFields.findFirst({
            where: (cf, { eq }) => eq(cf.id, fv.customFieldId),
          });
          if (!field) return null;

          // If specific custom fields requested, check if this field matches
          if (customFieldSlugs.size > 0 && !customFieldSlugs.has(field.slug)) {
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

      // Filter out null values, sort by order, then remove internal _order property
      const validCustomFieldsData = customFieldsData.filter((cf): cf is NonNullable<typeof cf> => cf !== null);
      validCustomFieldsData.sort((a, b) => (a._order || 0) - (b._order || 0));
      
      // Remove internal _order property before building response
      cleanedCustomFieldsData = validCustomFieldsData.map((cf) => {
        const { _order, ...rest } = cf;
        return rest;
      });
    }

    // Fetch featured image if requested or if no fields specified
    let featuredImage = null;
    if ((!requestedFields || requestedFields.length === 0 || includeFeaturedImage || standardFields.size === 0) && post.featuredImageId) {
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

    // Fetch related posts if requested or if no fields specified
    let relatedPostsData: any[] = [];
    if (!requestedFields || requestedFields.length === 0 || includeRelatedPosts || standardFields.size === 0) {
      const relationships = await db.query.postRelationships.findMany({
        where: (pr, { eq }) => eq(pr.fromPostId, post.id),
      });

      relatedPostsData = await Promise.all(
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

    // Build response object based on requested fields
    const postWithRelations: any = {};

    // Add standard fields
    if (!requestedFields || requestedFields.length === 0 || standardFields.size === 0) {
      // Include all standard fields if no fields specified or no standard fields specified
      postWithRelations.id = post.id;
      postWithRelations.title = post.title;
      postWithRelations.slug = post.slug;
      postWithRelations.excerpt = post.excerpt;
      postWithRelations.content = post.content;
      postWithRelations.status = post.status;
      postWithRelations.publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null;
      postWithRelations.updatedAt = post.updatedAt ? new Date(post.updatedAt).toISOString() : null;
      postWithRelations.createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null;
    } else {
      // Include only requested standard fields
      if (standardFields.has('id')) postWithRelations.id = post.id;
      if (standardFields.has('title')) postWithRelations.title = post.title;
      if (standardFields.has('slug')) postWithRelations.slug = post.slug;
      if (standardFields.has('excerpt')) postWithRelations.excerpt = post.excerpt;
      if (standardFields.has('content')) postWithRelations.content = post.content;
      if (standardFields.has('status')) postWithRelations.status = post.status;
      if (standardFields.has('publishedAt')) postWithRelations.publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null;
      if (standardFields.has('updatedAt')) postWithRelations.updatedAt = post.updatedAt ? new Date(post.updatedAt).toISOString() : null;
      if (standardFields.has('createdAt')) postWithRelations.createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null;
    }

    // Add author if requested or if no fields specified
    if (!requestedFields || requestedFields.length === 0 || authorFields.size > 0 || standardFields.size === 0) {
      if (authorFields.size === 0 || standardFields.size === 0) {
        // Include all author fields
        postWithRelations.author = {
          id: post.author.id,
          name: post.author.name,
          email: post.author.email,
          avatarUrl: post.author.avatarUrl || null,
        };
      } else {
        // Include only requested author fields
        postWithRelations.author = {};
        if (authorFields.has('id')) postWithRelations.author.id = post.author.id;
        if (authorFields.has('name')) postWithRelations.author.name = post.author.name;
        if (authorFields.has('email')) postWithRelations.author.email = post.author.email;
        if (authorFields.has('avatarUrl')) postWithRelations.author.avatarUrl = post.author.avatarUrl || null;
      }
    }

    // Add postType if requested or if no fields specified
    if (!requestedFields || requestedFields.length === 0 || postTypeFieldsSet.size > 0 || standardFields.size === 0) {
      if (postTypeFieldsSet.size === 0 || standardFields.size === 0) {
        // Include all postType fields
        postWithRelations.postType = {
          id: post.postType.id,
          name: post.postType.name,
          slug: post.postType.slug,
        };
      } else {
        // Include only requested postType fields
        postWithRelations.postType = {};
        if (postTypeFieldsSet.has('id')) postWithRelations.postType.id = post.postType.id;
        if (postTypeFieldsSet.has('name')) postWithRelations.postType.name = post.postType.name;
        if (postTypeFieldsSet.has('slug')) postWithRelations.postType.slug = post.postType.slug;
      }
    }

    // Add featured image if requested or if no fields specified
    if (!requestedFields || requestedFields.length === 0 || includeFeaturedImage || standardFields.size === 0) {
      postWithRelations.featuredImage = featuredImage;
    }

    // Add taxonomies if requested or if no fields specified
    if (!requestedFields || requestedFields.length === 0 || includeTaxonomies || standardFields.size === 0) {
      postWithRelations.taxonomies = taxonomiesBySlug;
    }

    // Add custom fields if requested or if no fields specified
    if (shouldIncludeCustomFields && cleanedCustomFieldsData.length > 0) {
      postWithRelations.customFields = cleanedCustomFieldsData.reduce((acc: Record<string, unknown>, cf: any) => {
        if (cf && cf.field) {
          acc[cf.field.slug] = cf.value;
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      if (Object.keys(postWithRelations.customFields).length > 0) {
        console.log(`[DEBUG] Successfully resolved ${Object.keys(postWithRelations.customFields).length} custom fields for post ${post.id}`);
      }
    }

    // Add related posts if requested or if no fields specified
    if (!requestedFields || requestedFields.length === 0 || includeRelatedPosts || standardFields.size === 0) {
      postWithRelations.relatedPosts = relatedPostsData.filter(Boolean);
    }

    // Set caching headers (10 minutes for individual posts)
    return c.json(successResponse(postWithRelations), 200, {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
    });
  }
);

export default app;

