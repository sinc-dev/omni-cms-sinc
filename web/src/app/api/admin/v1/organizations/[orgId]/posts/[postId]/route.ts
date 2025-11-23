import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updatePostSchema } from '@/lib/validations/post';
import { posts, postFieldValues, postTaxonomies, organizations } from '@/db/schema';
import { invalidatePostCache, invalidateTaxonomyCache } from '@/lib/cache/invalidation';
import { createPostVersion, cleanupOldVersions } from '@/lib/versioning/version-manager';
import { dispatchWebhook } from '@/lib/webhooks/webhook-dispatcher';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/posts/:postId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ),
      with: {
        author: true,
        postType: true,
        fieldValues: true,
        // taxonomies: true, // Need to setup relation properly in schema if not already
      },
    });

    if (!post) {
      return Errors.notFound('Post');
    }

    // Fetch taxonomies separately if relation is complex
    const taxonomies = await db.query.postTaxonomies.findMany({
      where: eq(postTaxonomies.postId, postId),
      with: {
        // term: true, // Assuming term relation exists
      }
    });

    return successResponse({ ...post, taxonomies });
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/posts/:postId
export const PATCH = withAuth(
  async (request, { db, user, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    const validation = await validateRequest(request, updatePostSchema);
    if (!validation.success) return validation.response;

    // Get current post to check postTypeId if slug is being updated
    const currentPost = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ),
    });
    
    if (!currentPost) {
      return Errors.notFound('Post');
    }

    const {
      customFields,
      taxonomies,
      relationships,
      autoSave,
      scheduledPublishAt,
      structuredData,
      ...restPostData
    } = validation.data;

    const postData: Record<string, unknown> = { ...restPostData };

    // Convert structuredData object to JSON string if provided
    if (structuredData !== undefined) {
      postData.structuredData = structuredData ? JSON.stringify(structuredData) : null;
    }

    // If auto-save, preserve current status (don't change from published to draft)
    // But if current status is draft, keep it as draft
    if (autoSave && currentPost.status === 'draft') {
      postData.status = 'draft';
    } else if (autoSave && currentPost.status === 'published') {
      // Don't change status on auto-save if already published
      delete postData.status;
    }

    // Parse scheduledPublishAt if provided
    if (scheduledPublishAt !== undefined) {
      postData.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null;
    }

    // Check slug conflict if slug is being updated
    // Posts have unique slugs per organization + post type
    // Note: postTypeId cannot be changed in update, so we use currentPost.postTypeId
    if (postData.slug && typeof postData.slug === 'string') {
      const existing = await db.select().from(posts).where(
        and(
          eq(posts.organizationId, organizationId!),
          eq(posts.postTypeId, currentPost.postTypeId),
          eq(posts.slug, postData.slug),
          sql`${posts.id} != ${postId}`
        )
      ).limit(1).then(rows => rows[0] || null);

      if (existing) {
        return Errors.badRequest('Post with this slug already exists for this post type');
      }
    }

    // Create version before updating (unless it's an auto-save)
    if (!autoSave) {
      try {
        await createPostVersion(db, {
          postId,
          userId: user.id,
          title: currentPost.title,
          slug: currentPost.slug,
          content: currentPost.content,
          excerpt: currentPost.excerpt,
          customFields: customFields,
        });

        // Clean up old versions (keep last 50)
        await cleanupOldVersions(db, postId, 50);
      } catch (error) {
        // Don't fail the update if versioning fails
        console.error('Failed to create version:', error);
      }
    }

    // Update post core data
    const updated = await db
      .update(posts)
      .set({
        ...(postData as any),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Post');
    }

    // Update custom fields if provided
    if (customFields) {
      // Delete existing values for fields being updated
      // This is a simplified approach; production might need smarter diffing
      const fieldIds = Object.keys(customFields);
      // We can't easily delete only specific fields without complex query
      // So we'll delete all for this post and re-insert (or upsert if supported)
      
      // Better approach: Upsert each field value
      for (const [fieldId, value] of Object.entries(customFields)) {
        // Check if exists
        const existing = await db.query.postFieldValues.findFirst({
            where: and(
                eq(postFieldValues.postId, postId),
                eq(postFieldValues.customFieldId, fieldId)
            )
        });

        if (existing) {
             await db.update(postFieldValues)
                .set({ 
                    value: typeof value === 'string' ? value : JSON.stringify(value),
                    updatedAt: new Date() 
                })
                .where(eq(postFieldValues.id, existing.id));
        } else {
            await db.insert(postFieldValues).values({
                id: nanoid(),
                postId,
                customFieldId: fieldId,
                value: typeof value === 'string' ? value : JSON.stringify(value),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
      }
    }

    // Update taxonomies if provided
    if (taxonomies) {
        // Simplified: Delete all and re-insert
        await db.delete(postTaxonomies).where(eq(postTaxonomies.postId, postId));
        
        const taxonomyValues = Object.values(taxonomies).flat().map((termId) => ({
            id: nanoid(),
            postId,
            taxonomyTermId: String(termId),
            createdAt: new Date(),
        }));

        if (taxonomyValues.length > 0) {
            await db.insert(postTaxonomies).values(taxonomyValues);
        }
    }

    const updatedResult = Array.isArray(updated) ? updated[0] : updated;
    if (!updatedResult) {
      return Errors.serverError('Failed to update post');
    }

    // Invalidate cache for this post and related endpoints
    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId!),
      });
      
      if (org) {
        const postSlug = updatedResult.slug || currentPost.slug;
        await invalidatePostCache(org.slug, postSlug);
        
        // If taxonomies were updated, invalidate taxonomy-related cache
        if (taxonomies) {
          await invalidateTaxonomyCache(org.slug);
        }
      }
    } catch (error) {
      // Don't fail the request if cache invalidation fails
      console.error('Failed to invalidate cache:', error);
    }

    // Dispatch webhook event
    try {
      await dispatchWebhook(db, organizationId!, {
        event: 'post.updated',
        data: {
          postId: updatedResult.id,
          title: updatedResult.title,
          slug: updatedResult.slug,
          status: updatedResult.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Don't fail the request if webhook fails
      console.error('Failed to dispatch webhook:', error);
    }

    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/posts/:postId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    // Get post info before deletion for cache invalidation
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ),
    });

    const deleted = await db
      .delete(posts)
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    
    // Invalidate cache for this post
    if (post) {
      try {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId!),
        });
        
        if (org && post.slug) {
          await invalidatePostCache(org.slug, post.slug);
        }
      } catch (error) {
        // Don't fail the request if cache invalidation fails
        console.error('Failed to invalidate cache:', error);
      }

      // Dispatch webhook event
      try {
        await dispatchWebhook(db, organizationId!, {
          event: 'post.deleted',
          data: {
            postId: post.id,
            title: post.title,
            slug: post.slug,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        // Don't fail the request if webhook fails
        console.error('Failed to dispatch webhook:', error);
      }
    }
    
    // Note: deleted array may be empty if post was already deleted, but we still return success
    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'posts:delete',
    requireOrgAccess: true,
  }
);

