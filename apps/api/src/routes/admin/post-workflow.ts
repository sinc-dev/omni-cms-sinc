import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, workflowComments, workflowAssignments } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const submitReviewSchema = z.object({
  reviewerId: z.string().optional(),
});

const approveSchema = z.object({
  comment: z.string().optional(),
});

const rejectSchema = z.object({
  comment: z.string().min(1, 'Comment is required for rejection'),
});

// POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow?action=submit
app.post(
  '/:orgId/posts/:postId/workflow',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');
    const action = c.req.query('action') || 'submit';

    if (!postId) {
      return c.json(Errors.badRequest('Post ID required'), 400);
    }

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    if (action === 'submit') {
      // Submit for review
      const body = await c.req.json().catch(() => ({}));
      const validation = submitReviewSchema.safeParse(body);
      
      if (!validation.success) {
          return c.json(Errors.validationError(validation.error.issues), 400);
      }

      // Update workflow status
      await db
        .update(posts)
        .set({
          workflowStatus: 'pending_review',
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      // Assign reviewer if provided
      if (validation.data.reviewerId) {
        await db.insert(workflowAssignments).values({
          id: nanoid(),
          postId,
          reviewerId: validation.data.reviewerId,
          assignedAt: new Date(),
        });
      }

      return c.json(successResponse({ message: 'Post submitted for review' }));
    } else if (action === 'approve') {
      // Approve post
      const body = await c.req.json().catch(() => ({}));
      const validation = approveSchema.safeParse(body);
      
      if (!validation.success) {
          return c.json(Errors.validationError(validation.error.issues), 400);
      }

      // Update workflow status
      await db
        .update(posts)
        .set({
          workflowStatus: 'approved',
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      // Add comment if provided
      if (validation.data.comment) {
        await db.insert(workflowComments).values({
          id: nanoid(),
          postId,
          userId: user.id,
          comment: validation.data.comment,
          createdAt: new Date(),
        });
      }

      return c.json(successResponse({ message: 'Post approved' }));
    } else if (action === 'reject') {
      // Reject post
      const body = await c.req.json().catch(() => ({}));
      const validation = rejectSchema.safeParse(body);
      
      if (!validation.success) {
          return c.json(Errors.validationError(validation.error.issues), 400);
      }

      // Update workflow status
      await db
        .update(posts)
        .set({
          workflowStatus: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(posts.id, postId));

      // Add rejection comment
      await db.insert(workflowComments).values({
        id: nanoid(),
        postId,
        userId: user.id,
        comment: validation.data.comment,
        createdAt: new Date(),
      });

      return c.json(successResponse({ message: 'Post rejected' }));
    }

    return c.json(Errors.badRequest('Invalid action'), 400);
  }
);

export default app;

