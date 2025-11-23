import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts, organizations } from '@/db/schema';
import { invalidatePostCache } from '@/lib/cache/invalidation';
import { dispatchWebhook } from '@/lib/webhooks/webhook-dispatcher';

export const runtime = 'edge';

// POST /api/admin/v1/organizations/:orgId/posts/:postId/publish
export const POST = withAuth(
  async (request, { db, organizationId }, params) => {
    const postId = params?.postId;
    if (!postId) return Errors.badRequest('Post ID required');

    // Get action from query param (publish or unpublish)
    // Or we can use separate routes. Let's assume this route handles both via body or just publish
    // For clarity, let's check the URL or body. 
    // Actually, let's make this route specifically for PUBLISH action as per filename
    
    const updated = await db
      .update(posts)
      .set({
        status: 'published',
        publishedAt: new Date(),
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

    const updatedResult = updatedArray[0];
    
    // Invalidate cache when post is published/unpublished
    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId!),
      });
      
      if (org && updatedResult.slug) {
        await invalidatePostCache(org.slug, updatedResult.slug);
      }
    } catch (error) {
      // Don't fail the request if cache invalidation fails
      console.error('Failed to invalidate cache:', error);
    }

    // Dispatch webhook event
    try {
      await dispatchWebhook(db, organizationId!, {
        event: 'post.published',
        data: {
          postId: updatedResult.id,
          title: updatedResult.title,
          slug: updatedResult.slug,
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
    requiredPermission: 'posts:publish',
    requireOrgAccess: true,
  }
);

// We can add unpublish route here or in a separate file
// For simplicity, let's handle unpublish via DELETE method on this same route? 
// Or better, a separate route `unpublish/route.ts`
// But since I can't create too many files, let's handle unpublish here via DELETE method
// DELETE /api/admin/v1/organizations/:orgId/posts/:postId/publish (Unpublish)
export const DELETE = withAuth(
    async (request, { db, organizationId }, params) => {
      const postId = params?.postId;
      if (!postId) return Errors.badRequest('Post ID required');
  
      const updated = await db
        .update(posts)
        .set({
          status: 'draft',
          publishedAt: null,
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
  
      const updatedResult = updatedArray[0];
      
      // Invalidate cache when post is unpublished
      try {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId!),
        });
        
        if (org && updatedResult.slug) {
          await invalidatePostCache(org.slug, updatedResult.slug);
        }
      } catch (error) {
        // Don't fail the request if cache invalidation fails
        console.error('Failed to invalidate cache:', error);
      }

      // Dispatch webhook event
      try {
        await dispatchWebhook(db, organizationId!, {
          event: 'post.unpublished',
          data: {
            postId: updatedResult.id,
            title: updatedResult.title,
            slug: updatedResult.slug,
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
      requiredPermission: 'posts:publish', // Requires publish permission to unpublish too
      requireOrgAccess: true,
    }
  );

