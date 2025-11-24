import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { contentBlocks } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateContentBlockSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  blockType: z.enum(['text', 'image', 'video', 'gallery', 'cta', 'code', 'embed']).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/content-blocks/:blockId
app.get(
  '/:orgId/content-blocks/:blockId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const blockId = c.req.param('blockId');

    const block = await db.query.contentBlocks.findFirst({
      where: (cb, { eq, and: andFn }) => andFn(
        eq(cb.id, blockId),
        eq(cb.organizationId, organizationId!)
      ),
    });

    if (!block) {
      return c.json(Errors.notFound('Content block'), 404);
    }

    return c.json(successResponse(block));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/content-blocks/:blockId
app.patch(
  '/:orgId/content-blocks/:blockId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const blockId = c.req.param('blockId');

    const block = await db.query.contentBlocks.findFirst({
      where: (cb, { eq, and: andFn }) => andFn(
        eq(cb.id, blockId),
        eq(cb.organizationId, organizationId!)
      ),
    });

    if (!block) {
      return c.json(Errors.notFound('Content block'), 404);
    }

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateContentBlockSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.slug) updatePayload.slug = updateData.slug;
    if (updateData.blockType) updatePayload.blockType = updateData.blockType;
    if (updateData.content) updatePayload.content = JSON.stringify(updateData.content);

    // Check slug conflict if slug is being updated
    if (updateData.slug && updateData.slug !== block.slug) {
      const existing = await db.query.contentBlocks.findFirst({
        where: (cb, { eq, and: andFn }) => andFn(
          eq(cb.organizationId, organizationId!),
          eq(cb.slug, updateData.slug!)
        ),
      });

      if (existing && existing.id !== blockId) {
        return c.json(Errors.badRequest('Content block with this slug already exists'), 400);
      }
    }

    const updated = await db
      .update(contentBlocks)
      .set(updatePayload)
      .where(eq(contentBlocks.id, blockId))
      .returning();

    return c.json(successResponse(updated[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/content-blocks/:blockId
app.delete(
  '/:orgId/content-blocks/:blockId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const blockId = c.req.param('blockId');

    const block = await db.query.contentBlocks.findFirst({
      where: (cb, { eq, and: andFn }) => andFn(
        eq(cb.id, blockId),
        eq(cb.organizationId, organizationId!)
      ),
    });

    if (!block) {
      return c.json(Errors.notFound('Content block'), 404);
    }

    await db.delete(contentBlocks).where(eq(contentBlocks.id, blockId));

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

