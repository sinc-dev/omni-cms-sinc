import { eq, and, like, or, desc, sql, gte, lte, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset, parseDateParam, parseSortParam } from '@/lib/api/validation';
import { createPostSchema } from '@/lib/validations/post';
import { posts, postFieldValues, postTaxonomies, postRelationships, organizations } from '@/db/schema';
import { invalidatePostCache } from '@/lib/cache/invalidation';
import { dispatchWebhook } from '@/lib/webhooks/webhook-dispatcher';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/posts
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
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
      // Enhanced search: title, content, and excerpt
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
        return Errors.badRequest('Invalid created_from date format');
      }
      conditions.push(gte(posts.createdAt, fromDate));
    }

    if (createdTo) {
      const toDate = parseDateParam(createdTo);
      if (!toDate) {
        return Errors.badRequest('Invalid created_to date format');
      }
      conditions.push(lte(posts.createdAt, toDate));
    }

    if (publishedFrom) {
      const fromDate = parseDateParam(publishedFrom);
      if (!fromDate) {
        return Errors.badRequest('Invalid published_from date format');
      }
      conditions.push(gte(posts.publishedAt, fromDate));
    }

    if (publishedTo) {
      const toDate = parseDateParam(publishedTo);
      if (!toDate) {
        return Errors.badRequest('Invalid published_to date format');
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

    return paginatedResponse(allPosts, page, perPage, total);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/posts
export const POST = withAuth(
  async (request, { db, user, organizationId }) => {
    const validation = await validateRequest(request, createPostSchema);
    if (!validation.success) return validation.response;

    const { customFields, taxonomies, relationships, autoSave, scheduledPublishAt, ...postData } = validation.data;

    // If auto-save, always save as draft regardless of status
    if (autoSave) {
      postData.status = 'draft';
    }

    // Parse scheduledPublishAt if provided
    if (scheduledPublishAt) {
      (postData as any).scheduledPublishAt = new Date(scheduledPublishAt);
    }

    // Check if slug already exists for this post type in this organization
    const existing = await db.query.posts.findFirst({
      where: and(
        eq(posts.organizationId, organizationId!),
        eq(posts.postTypeId, postData.postTypeId),
        eq(posts.slug, postData.slug)
      ),
    });

    if (existing) {
      return Errors.badRequest('Post with this slug already exists for this post type');
    }

    // Convert structuredData to JSON string if provided
    const insertData: Record<string, unknown> = {
      id: nanoid(),
      organizationId: organizationId!,
      authorId: user.id,
      postTypeId: postData.postTypeId,
      title: postData.title,
      slug: postData.slug,
      status: postData.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Add optional fields
    if (postData.content !== undefined) insertData.content = postData.content;
    if (postData.excerpt !== undefined) insertData.excerpt = postData.excerpt;
    if (postData.parentId !== undefined) insertData.parentId = postData.parentId;
    if (postData.featuredImageId !== undefined) insertData.featuredImageId = postData.featuredImageId;
    if (postData.metaTitle !== undefined) insertData.metaTitle = postData.metaTitle;
    if (postData.metaDescription !== undefined) insertData.metaDescription = postData.metaDescription;
    if (postData.metaKeywords !== undefined) insertData.metaKeywords = postData.metaKeywords;
    if (postData.ogImageId !== undefined) insertData.ogImageId = postData.ogImageId;
    if (postData.canonicalUrl !== undefined) insertData.canonicalUrl = postData.canonicalUrl;
    
    // Handle structuredData conversion
    if (postData.structuredData) {
      insertData.structuredData = typeof postData.structuredData === 'string' 
        ? postData.structuredData 
        : JSON.stringify(postData.structuredData);
    }
    
    // Handle scheduledPublishAt
    if ((postData as any).scheduledPublishAt) {
      insertData.scheduledPublishAt = (postData as any).scheduledPublishAt;
    }
    
    // Create post
    const newPost = await db
      .insert(posts)
      .values(insertData as any)
      .returning();

    const postResult = Array.isArray(newPost) ? newPost[0] : newPost;
    if (!postResult) {
      return Errors.serverError('Failed to create post');
    }
    const post = postResult;

    // Insert custom field values
    if (customFields) {
      const fieldValues = Object.entries(customFields).map(([fieldId, value]) => ({
        id: nanoid(),
        postId: post.id,
        customFieldId: fieldId,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (fieldValues.length > 0) {
        await db.insert(postFieldValues).values(fieldValues);
      }
    }

    // Insert taxonomies
    if (taxonomies) {
      const taxonomyValues = Object.values(taxonomies).flat().map((termId) => ({
        id: nanoid(),
        postId: post.id,
        taxonomyTermId: String(termId),
        createdAt: new Date(),
      }));

      if (taxonomyValues.length > 0) {
        await db.insert(postTaxonomies).values(taxonomyValues);
      }
    }

    // Insert relationships
    if (relationships) {
        // This part needs careful implementation based on relationship structure
        // For now, we'll skip complex relationship insertion in initial create
        // and handle it in update or separate endpoint if needed
    }

    // Invalidate cache if post is published
    if (post.status === 'published' && post.slug) {
      try {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId!),
        });
        
        if (org) {
          await invalidatePostCache(org.slug, post.slug);
        }
      } catch (error) {
        // Don't fail the request if cache invalidation fails
        console.error('Failed to invalidate cache:', error);
      }
    }

    // Dispatch webhook event
    try {
      await dispatchWebhook(db, organizationId!, {
        event: 'post.created',
        data: {
          postId: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't fail the request if webhook fails
      console.error('Failed to dispatch webhook:', error);
    }

    return successResponse(post);
  },
  {
    requiredPermission: 'posts:create',
    requireOrgAccess: true,
  }
);
