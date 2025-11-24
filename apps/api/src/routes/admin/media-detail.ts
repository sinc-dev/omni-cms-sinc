import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { z } from 'zod';
import { media } from '../../db/schema';
import { deleteFileFromR2 } from '../../lib/storage/upload';
import { getMediaVariantUrls } from '../../lib/media/urls';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateMediaSchema = z.object({
  altText: z.string().optional(),
  caption: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/media/:mediaId
app.get(
  '/:orgId/media/:mediaId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('media:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const mediaId = c.req.param('mediaId');

    const file = await db.query.media.findFirst({
      where: (m, { eq, and: andFn }) => andFn(
        eq(m.id, mediaId),
        eq(m.organizationId, organizationId!)
      ),
      with: {
        uploader: true,
      },
    });

    if (!file) {
      return c.json(Errors.notFound('Media file'), 404);
    }

    return c.json(successResponse({
      ...file,
      urls: getMediaVariantUrls(file),
    }));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/media/:mediaId
app.patch(
  '/:orgId/media/:mediaId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('media:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const mediaId = c.req.param('mediaId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateMediaSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const updated = await db
      .update(media)
      .set({
        ...updateData,
        metadata: updateData.metadata
          ? JSON.stringify(updateData.metadata)
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
      return c.json(Errors.notFound('Media file'), 404);
    }

    return c.json(successResponse(updatedArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/media/:mediaId
app.delete(
  '/:orgId/media/:mediaId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('media:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const mediaId = c.req.param('mediaId');

    // Get the media record to find the file key
    const file = await db.query.media.findFirst({
      where: (m, { eq, and: andFn }) => andFn(
        eq(m.id, mediaId),
        eq(m.organizationId, organizationId!)
      ),
    });

    if (!file) {
      return c.json(Errors.notFound('Media file'), 404);
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

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

