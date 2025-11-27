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
  postFieldValues,
  customFields,
  postTypeFields,
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
    const fieldsParam = c.req.query('fields') ?? undefined;

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
        } else {
          standardFields.add(field);
        }
      }
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

    // Fetch taxonomies, featured images, custom fields, and format data for each post
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

        // Fetch custom fields if requested or if no fields specified (include all)
        let customFieldsData: any[] = [];
        const shouldIncludeCustomFields = !requestedFields || customFieldSlugs.size > 0 || requestedFields.length === 0;
        
        if (shouldIncludeCustomFields && post.postTypeId) {
          const allowedCustomFieldIds = postTypeFieldsMap.get(post.postTypeId) || new Set<string>();
          const customFieldOrderMapForPostType = customFieldOrderMap; // Use the global map for order

          if (allowedCustomFieldIds.size > 0) {
            // Fetch all field values for this post
            const fieldValuesData = await db.query.postFieldValues.findMany({
              where: (pfv, { eq }) => eq(pfv.postId, post.id),
            });

            // Filter to only include values for custom fields attached to this post type
            const filteredFieldValues = fieldValuesData.filter(fv => allowedCustomFieldIds.has(fv.customFieldId));

            // If specific custom fields requested, filter by slug
            const fieldValuesToProcess = customFieldSlugs.size > 0
              ? filteredFieldValues.filter(fv => {
                  // We need to check if the custom field slug matches
                  // This will be done in the Promise.all below
                  return true; // Will filter by slug later
                })
              : filteredFieldValues;

            customFieldsData = await Promise.all(
              fieldValuesToProcess.map(async (fv) => {
                const customField = await db.query.customFields.findFirst({
                  where: (cf, { eq }) => eq(cf.id, fv.customFieldId),
                });

                if (!customField) return null;

                // If specific custom fields requested, check if this field matches
                if (customFieldSlugs.size > 0 && !customFieldSlugs.has(customField.slug)) {
                  return null;
                }

                // Parse value based on field type
                let parsedValue: any = fv.value;
                try {
                  if (['number', 'boolean', 'select', 'multi_select', 'json'].includes(customField.fieldType)) {
                    parsedValue = JSON.parse(fv.value as string);
                  }
                } catch {
                  // Keep original value if parsing fails
                }

                return {
                  field: {
                    id: customField.id,
                    name: customField.name,
                    slug: customField.slug,
                    fieldType: customField.fieldType,
                  },
                  value: parsedValue,
                  _order: customFieldOrderMapForPostType.get(fv.customFieldId) ?? 0, // Internal use for sorting only
                };
              })
            );

            // Filter out null values, sort by order, then remove internal _order property
            const validCustomFieldsData = customFieldsData.filter((cf): cf is NonNullable<typeof cf> => cf !== null);
            validCustomFieldsData.sort((a, b) => (a._order || 0) - (b._order || 0));
            
            // Remove internal _order property before building response
            customFieldsData = validCustomFieldsData.map((cf) => {
              const { _order, ...rest } = cf;
              return rest;
            });
          }
        }

        // Build response object based on requested fields
        const response: any = {};

        // Add standard fields
        if (!requestedFields || requestedFields.length === 0 || standardFields.size === 0) {
          // Include all standard fields if no fields specified or no standard fields specified
          response.id = post.id;
          response.title = post.title;
          response.slug = post.slug;
          response.excerpt = post.excerpt;
          response.content = post.content;
          response.status = post.status;
          response.publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null;
          response.updatedAt = post.updatedAt ? new Date(post.updatedAt).toISOString() : null;
          response.createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null;
        } else {
          // Include only requested standard fields
          if (standardFields.has('id')) response.id = post.id;
          if (standardFields.has('title')) response.title = post.title;
          if (standardFields.has('slug')) response.slug = post.slug;
          if (standardFields.has('excerpt')) response.excerpt = post.excerpt;
          if (standardFields.has('content')) response.content = post.content;
          if (standardFields.has('status')) response.status = post.status;
          if (standardFields.has('publishedAt')) response.publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : null;
          if (standardFields.has('updatedAt')) response.updatedAt = post.updatedAt ? new Date(post.updatedAt).toISOString() : null;
          if (standardFields.has('createdAt')) response.createdAt = post.createdAt ? new Date(post.createdAt).toISOString() : null;
        }

        // Add author if requested or if no fields specified
        if (!requestedFields || requestedFields.length === 0 || authorFields.size > 0 || standardFields.size === 0) {
          if (authorFields.size === 0 || standardFields.size === 0) {
            // Include all author fields
            response.author = {
              id: post.author.id,
              name: post.author.name,
              email: post.author.email,
              avatarUrl: post.author.avatarUrl || null,
            };
          } else {
            // Include only requested author fields
            response.author = {};
            if (authorFields.has('id')) response.author.id = post.author.id;
            if (authorFields.has('name')) response.author.name = post.author.name;
            if (authorFields.has('email')) response.author.email = post.author.email;
            if (authorFields.has('avatarUrl')) response.author.avatarUrl = post.author.avatarUrl || null;
          }
        }

        // Add postType if requested or if no fields specified
        if (!requestedFields || requestedFields.length === 0 || postTypeFieldsSet.size > 0 || standardFields.size === 0) {
          if (postTypeFieldsSet.size === 0 || standardFields.size === 0) {
            // Include all postType fields
            response.postType = {
              id: post.postType.id,
              name: post.postType.name,
              slug: post.postType.slug,
            };
          } else {
            // Include only requested postType fields
            response.postType = {};
            if (postTypeFieldsSet.has('id')) response.postType.id = post.postType.id;
            if (postTypeFieldsSet.has('name')) response.postType.name = post.postType.name;
            if (postTypeFieldsSet.has('slug')) response.postType.slug = post.postType.slug;
          }
        }

        // Add featured image if requested or if no fields specified
        if (!requestedFields || requestedFields.length === 0 || includeFeaturedImage || standardFields.size === 0) {
          response.featuredImage = featuredImage;
        }

        // Add taxonomies if requested or if no fields specified
        if (!requestedFields || requestedFields.length === 0 || includeTaxonomies || standardFields.size === 0) {
          response.taxonomies = taxonomiesBySlug;
        }

        // Add custom fields if requested or if no fields specified
        if (shouldIncludeCustomFields && customFieldsData.length > 0) {
          response.customFields = customFieldsData;
        }

        return response;
      })
    );

    return c.json(paginatedResponse(postsWithRelations, page, perPage, total), 200, {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    });
  }
);

export default app;

