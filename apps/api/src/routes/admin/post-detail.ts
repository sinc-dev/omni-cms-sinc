import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { updatePostSchema } from '../../lib/validations/post';
import { posts, postFieldValues, postTaxonomies } from '../../db/schema';
import { invalidatePostCache, invalidateTaxonomyCache } from '../../lib/cache/invalidation';
import { createPostVersion, cleanupOldVersions } from '../../lib/versioning/version-manager';
import { dispatchWebhook } from '../../lib/webhooks/webhook-dispatcher';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/posts/:postId
app.get(
  '/:orgId/posts/:postId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
      with: {
        author: true,
        postType: true,
        fieldValues: true,
      },
    });

    if (!post) {
      return c.json(Errors.notFound('Post'));
    }

    // Fetch taxonomies separately
    const taxonomies = await db.query.postTaxonomies.findMany({
      where: (pt, { eq }) => eq(pt.postId, postId),
    });

    return c.json(successResponse({ ...post, taxonomies }));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/posts/:postId
app.patch(
  '/:orgId/posts/:postId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updatePostSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // Get existing post
    const existingPost = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!existingPost) {
      return c.json(Errors.notFound('Post'));
    }

    try {
      // Extract fields that don't belong in posts table
      const {
        customFields,
        taxonomies,
        relationships,
        autoSave,
        scheduledPublishAt,
        structuredData,
        ...postFields
      } = updateData;

      // Convert scheduledPublishAt from string to Date if provided
      const postUpdateData: Record<string, unknown> = { ...postFields };
      if (scheduledPublishAt !== undefined) {
        postUpdateData.scheduledPublishAt = scheduledPublishAt ? new Date(scheduledPublishAt) : null;
      }

      // Convert structuredData to JSON string if provided
      if (structuredData !== undefined) {
        postUpdateData.structuredData = structuredData ? JSON.stringify(structuredData) : null;
      }

      // Create version before update (unless auto-save)
      // Only create version if user is authenticated (not API key)
      if (!autoSave) {
        const { user } = getAuthContext(c);
        if (user?.id) {
          await createPostVersion(db, {
            postId,
            userId: user.id,
            title: existingPost.title,
            slug: existingPost.slug,
            content: existingPost.content,
            excerpt: existingPost.excerpt,
            customFields: customFields,
          });
        }
      }

      // Update post
      const updated = await db.update(posts)
        .set({
          ...postUpdateData,
          updatedAt: new Date(),
        } as any)
        .where(and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId!)
        ))
        .returning();

      // Update custom fields if provided
      if (updateData.customFields !== undefined) {
        // Delete existing field values
        await db.delete(postFieldValues)
          .where(eq(postFieldValues.postId, postId));

        // Insert new field values
        if (Object.keys(updateData.customFields).length > 0) {
          const fieldValues = Object.entries(updateData.customFields).map(([fieldId, value]) => ({
            id: nanoid(),
            postId,
            customFieldId: fieldId,
            value: JSON.stringify(value),
          }));
          await db.insert(postFieldValues).values(fieldValues);
        }
      }

      // Update taxonomies if provided
      if (updateData.taxonomies !== undefined) {
        await db.delete(postTaxonomies)
          .where(eq(postTaxonomies.postId, postId));

        let taxonomyLinks: Array<{ id: string; postId: string; taxonomyTermId: string }> = [];
        
        if (Array.isArray(updateData.taxonomies)) {
          taxonomyLinks = updateData.taxonomies.map((termId: string) => ({
            id: nanoid(),
            postId,
            taxonomyTermId: termId,
          }));
        } else if (typeof updateData.taxonomies === 'object') {
          taxonomyLinks = Object.values(updateData.taxonomies)
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

      // Cleanup old versions
      await cleanupOldVersions(db, postId);

      // Invalidate cache
      await invalidatePostCache(organizationId!, postId, db);
      if (updateData.taxonomies) {
        await invalidateTaxonomyCache(organizationId!, undefined, undefined, db);
      }

      // Dispatch webhook
      await dispatchWebhook(db, organizationId!, {
        event: 'post.updated',
        data: {
          postId,
          post: updated[0],
        },
        timestamp: new Date().toISOString(),
      });

      return c.json(successResponse(updated[0]));
    } catch (error) {
      console.error('Error updating post:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to update post'
      ));
    }
  }
);

// DELETE /api/admin/v1/organizations/:orgId/posts/:postId
app.delete(
  '/:orgId/posts/:postId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'));
    }

    try {
      // Delete related data
      await db.delete(postFieldValues).where(eq(postFieldValues.postId, postId));
      await db.delete(postTaxonomies).where(eq(postTaxonomies.postId, postId));

      // Delete post
      await db.delete(posts).where(and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ));

      // Invalidate cache
      await invalidatePostCache(organizationId!, postId, db);

      // Dispatch webhook
      await dispatchWebhook(db, organizationId!, {
        event: 'post.deleted',
        data: { postId },
        timestamp: new Date().toISOString(),
      });

      return c.json(successResponse({ deleted: true }));
    } catch (error) {
      console.error('Error deleting post:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to delete post'
      ));
    }
  }
);

export default app;

