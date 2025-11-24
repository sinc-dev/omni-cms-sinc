import { Hono } from 'hono';
import { eq, and, like, or, desc, sql, gte, lte, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { validateRequest, getPaginationParams, getOffset, parseDateParam, parseSortParam } from '../../lib/api/validation';
import { createPostSchema } from '../../lib/validations/post';
import { posts, postFieldValues, postTaxonomies, postRelationships, organizations } from '../../db/schema';
import { invalidatePostCache } from '../../lib/cache/invalidation';
import { dispatchWebhook } from '../../lib/webhooks/webhook-dispatcher';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/posts
app.get(
  '/:orgId/posts',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    // Get filter parameters
    const postType = url.searchParams.get('post_type') ?? undefined;
    const status = url.searchParams.get('status') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;
    const authorId = url.searchParams.get('author_id') ?? undefined;
    const createdFrom = url.searchParams.get('created_from') ?? undefined;
    const createdTo = url.searchParams.get('created_to') ?? undefined;
    const publishedFrom = url.searchParams.get('published_from') ?? undefined;
    const publishedTo = url.searchParams.get('published_to') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

    // Build where conditions
    const conditions = [eq(posts.organizationId, organizationId!)];
    if (postType) conditions.push(eq(posts.postTypeId, postType));
    if (status) conditions.push(eq(posts.status, status));
    if (authorId) conditions.push(eq(posts.authorId, authorId));
    if (search) {
      const searchTerm = `%${search}%`;
      const searchCondition = or(
        like(posts.title, searchTerm),
        like(posts.content, searchTerm),
        like(posts.excerpt, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Date range filters
    if (createdFrom) {
      const fromDate = parseDateParam(createdFrom);
      if (!fromDate) {
        return c.json(Errors.badRequest('Invalid created_from date format'), 400);
      }
      conditions.push(gte(posts.createdAt, fromDate));
    }

    if (createdTo) {
      const toDate = parseDateParam(createdTo);
      if (!toDate) {
        return c.json(Errors.badRequest('Invalid created_to date format'), 400);
      }
      conditions.push(lte(posts.createdAt, toDate));
    }

    if (publishedFrom) {
      const fromDate = parseDateParam(publishedFrom);
      if (!fromDate) {
        return c.json(Errors.badRequest('Invalid published_from date format'), 400);
      }
      conditions.push(gte(posts.publishedAt, fromDate));
    }

    if (publishedTo) {
      const toDate = parseDateParam(publishedTo);
      if (!toDate) {
        return c.json(Errors.badRequest('Invalid published_to date format'), 400);
      }
      conditions.push(lte(posts.publishedAt, toDate));
    }

    const orderBy = parseSortParam(sort, {
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      publishedAt: posts.publishedAt,
      title: posts.title,
      slug: posts.slug,
    }, 'createdAt', 'desc');

    const allPosts = await db.query.posts.findMany({
      where: and(...conditions),
      limit: perPage,
      offset,
      orderBy,
      with: {
        author: true,
        postType: true,
      },
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    return c.json(paginatedResponse(allPosts, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/posts
app.post(
  '/:orgId/posts',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:create'),
  async (c) => {
    const { db, user, organizationId, apiKey, authMethod } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const postData = createPostSchema.parse(body);

      // For API key auth, use a system user ID or the API key ID as author
      // In practice, you might want to create a system user for API operations
      const authorId = authMethod === 'api-key' 
        ? apiKey?.id || 'system' // Use API key ID or 'system' as fallback
        : user?.id;

      if (!authorId) {
        return c.json(Errors.unauthorized(), 401);
      }

      const postId = nanoid();
      const newPost = await db.insert(posts).values({
        id: postId,
        organizationId: organizationId!,
        authorId: authorId,
        postTypeId: postData.postTypeId,
        title: postData.title,
        slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: postData.excerpt || null,
        content: postData.content || null,
        status: postData.status || 'draft',
        publishedAt: postData.status === 'published' ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Handle custom fields if provided
      if (postData.customFields && Object.keys(postData.customFields).length > 0) {
        const fieldValues = Object.entries(postData.customFields).map(([fieldId, value]) => ({
          id: nanoid(),
          postId,
          customFieldId: fieldId,
          value: JSON.stringify(value),
        }));

        if (fieldValues.length > 0) {
          await db.insert(postFieldValues).values(fieldValues);
        }
      }

      // Handle taxonomies if provided
      // Taxonomies can be an object { taxonomyId: [termIds] } or array of termIds
      if (postData.taxonomies) {
        let taxonomyLinks: Array<{ id: string; postId: string; taxonomyTermId: string }> = [];
        
        if (Array.isArray(postData.taxonomies)) {
          // Simple array of term IDs
          taxonomyLinks = postData.taxonomies.map((termId: string) => ({
            id: nanoid(),
            postId,
            taxonomyTermId: termId,
          }));
        } else if (typeof postData.taxonomies === 'object') {
          // Object with taxonomy IDs as keys and term ID arrays as values
          taxonomyLinks = Object.values(postData.taxonomies)
            .flat()
            .map((termId: string) => ({
              id: nanoid(),
              postId,
              taxonomyTermId: String(termId),
            }));
        }

        if (taxonomyLinks.length > 0) {
          await db.insert(postTaxonomies).values(taxonomyLinks);
        }
      }

      // Invalidate cache
      await invalidatePostCache(organizationId!, postId, db as any);

      // Dispatch webhook
      await dispatchWebhook(db, organizationId!, {
        event: 'post.created',
        data: {
          postId,
          post: newPost[0],
        },
        timestamp: new Date().toISOString(),
      });

      return c.json(successResponse(newPost[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating post:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create post'
      ), 500);
    }
  }
);

export default app;

