import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { z } from 'zod';
import { media } from '@/db/schema';
import { deleteFileFromR2 } from '@/lib/storage/upload';
import { getMediaVariantUrls } from '@/lib/media/urls';

export const runtime = 'edge';

const updateMediaSchema = z.object({
  altText: z.string().optional(),
  caption: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/media/:mediaId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const mediaId = params?.mediaId;
    if (!mediaId) return Errors.badRequest('Media ID required');

    const file = await db.query.media.findFirst({
      where: and(
        eq(media.id, mediaId),
        eq(media.organizationId, organizationId!)
      ),
      with: {
        uploader: true,
      },
    });

    if (!file) {
      return Errors.notFound('Media file');
    }

    return successResponse({
      ...file,
      urls: getMediaVariantUrls(file),
    });
  },
  {
    requiredPermission: 'media:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/media/:mediaId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const mediaId = params?.mediaId;
    if (!mediaId) return Errors.badRequest('Media ID required');

    const validation = await validateRequest(request, updateMediaSchema);
    if (!validation.success) return validation.response;

    const updated = await db
      .update(media)
      .set({
        ...validation.data,
        metadata: validation.data.metadata
          ? JSON.stringify(validation.data.metadata)
          : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(media.id, mediaId),
          eq(media.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Media file');
    }

    const updatedResult = updatedArray[0];
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'media:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/media/:mediaId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const mediaId = params?.mediaId;
    if (!mediaId) return Errors.badRequest('Media ID required');

    // Get the media record to find the file key
    const file = await db.query.media.findFirst({
      where: and(
        eq(media.id, mediaId),
        eq(media.organizationId, organizationId!)
      ),
    });

    if (!file) {
      return Errors.notFound('Media file');
    }

    // Delete from R2 first
    try {
      await deleteFileFromR2(file.fileKey);
    } catch (error) {
      console.error('Failed to delete file from R2:', error);
      // Continue with DB deletion even if R2 deletion fails
    }

    // Delete from database
    await db
      .delete(media)
      .where(
        and(
          eq(media.id, mediaId),
          eq(media.organizationId, organizationId!)
        )
      );

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'media:delete',
    requireOrgAccess: true,
  }
);

