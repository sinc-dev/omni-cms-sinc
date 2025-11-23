import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { posts } from '@/db/schema/posts';
import { workflowComments, workflowAssignments } from '@/db/schema/workflow';
import { z } from 'zod';

const submitReviewSchema = z.object({
  reviewerId: z.string().optional(),
});

const approveSchema = z.object({
  comment: z.string().optional(),
});

const rejectSchema = z.object({
  comment: z.string().min(1, 'Comment is required for rejection'),
});

// POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow/submit-review
export async function submitForReview(
  request: Request,
  { db, user, organizationId }: { db: any; user: any; organizationId: string },
  params?: { postId?: string }
) {
  const postId = params?.postId;
  if (!postId) return Errors.badRequest('Post ID required');

  const validation = await validateRequest(request, submitReviewSchema);
  if (!validation.success) return validation.response;

  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, postId),
      eq(posts.organizationId, organizationId)
    ),
  });

  if (!post) {
    return Errors.notFound('Post');
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

  return successResponse({ message: 'Post submitted for review' });
}

// POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow/approve
export async function approvePost(
  request: Request,
  { db, user, organizationId }: { db: any; user: any; organizationId: string },
  params?: { postId?: string }
) {
  const postId = params?.postId;
  if (!postId) return Errors.badRequest('Post ID required');

  const validation = await validateRequest(request, approveSchema);
  if (!validation.success) return validation.response;

  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, postId),
      eq(posts.organizationId, organizationId)
    ),
  });

  if (!post) {
    return Errors.notFound('Post');
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

  return successResponse({ message: 'Post approved' });
}

// POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow/reject
export async function rejectPost(
  request: Request,
  { db, user, organizationId }: { db: any; user: any; organizationId: string },
  params?: { postId?: string }
) {
  const postId = params?.postId;
  if (!postId) return Errors.badRequest('Post ID required');

  const validation = await validateRequest(request, rejectSchema);
  if (!validation.success) return validation.response;

  const post = await db.query.posts.findFirst({
    where: and(
      eq(posts.id, postId),
      eq(posts.organizationId, organizationId)
    ),
  });

  if (!post) {
    return Errors.notFound('Post');
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

  return successResponse({ message: 'Post rejected' });
}

// POST /api/admin/v1/organizations/:orgId/posts/:postId/workflow
export const POST = withAuth(
  async (request, { db, user, organizationId }, params) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'submit';

    if (action === 'submit') {
      return submitForReview(request, { db, user, organizationId: organizationId! }, params);
    } else if (action === 'approve') {
      return approvePost(request, { db, user, organizationId: organizationId! }, params);
    } else if (action === 'reject') {
      return rejectPost(request, { db, user, organizationId: organizationId! }, params);
    }

    return Errors.badRequest('Invalid action');
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

