import { eq, and } from 'drizzle-orm';
import { withPublic } from '@/lib/api/public-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { z } from 'zod';
import { posts, organizations, postShares } from '@/db/schema';
import { nanoid } from 'nanoid';

const sharePostSchema = z.object({
  shareType: z.enum(['facebook', 'twitter', 'linkedin', 'email', 'link', 'other']),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

// POST /api/public/v1/:orgSlug/posts/:slug/share
// Record a share event for a post
export const POST = withPublic(
  async (request, { db }, params) => {
    const orgSlug = params?.orgSlug;
    const postSlug = params?.slug;

    if (!orgSlug || !postSlug) {
      return Errors.badRequest('Organization slug and post slug required');
    }

    // Validate request body
    const validation = await validateRequest(request, sharePostSchema);
    if (!validation.success) return validation.response;

    // Find organization
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!organization) {
      return Errors.notFound('Organization');
    }

    // Find post
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.organizationId, organization.id),
        eq(posts.slug, postSlug),
        eq(posts.status, 'published')
      ),
    });

    if (!post) {
      return Errors.notFound('Post');
    }

    // Record share
    const share = await db
      .insert(postShares)
      .values({
        id: nanoid(),
        postId: post.id,
        shareType: validation.data.shareType,
        metadata: validation.data.metadata ? JSON.stringify(validation.data.metadata) : null,
        createdAt: new Date(),
      })
      .returning();

    // Increment share count on post
    await db
      .update(posts)
      .set({
        shareCount: (post.shareCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id));

    return successResponse({
      id: share[0].id,
      shareType: share[0].shareType,
      createdAt: share[0].createdAt,
    });
  },
  {
    trackAnalytics: true,
  }
);

