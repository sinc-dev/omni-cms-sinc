import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { contentBlocks } from '@/db/schema/content-blocks';
import { z } from 'zod';

const updateContentBlockSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  blockType: z.enum(['text', 'image', 'video', 'gallery', 'cta', 'code', 'embed']).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/content-blocks/:blockId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const blockId = params?.blockId;
    if (!blockId) return Errors.badRequest('Block ID required');

    const block = await db.select().from(contentBlocks).where(
      and(
        eq(contentBlocks.id, blockId),
        eq(contentBlocks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!block) {
      return Errors.notFound('Content block');
    }

    return successResponse(block);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/content-blocks/:blockId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const blockId = params?.blockId;
    if (!blockId) return Errors.badRequest('Block ID required');

    const validation = await validateRequest(request, updateContentBlockSchema);
    if (!validation.success) return validation.response;

    const block = await db.select().from(contentBlocks).where(
      and(
        eq(contentBlocks.id, blockId),
        eq(contentBlocks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!block) {
      return Errors.notFound('Content block');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.slug) updateData.slug = validation.data.slug;
    if (validation.data.blockType) updateData.blockType = validation.data.blockType;
    if (validation.data.content) updateData.content = JSON.stringify(validation.data.content);

    // Check slug conflict if slug is being updated
    if (validation.data.slug && validation.data.slug !== block.slug) {
      const existing = await db.select().from(contentBlocks).where(
        and(
          eq(contentBlocks.organizationId, organizationId!),
          eq(contentBlocks.slug, validation.data.slug),
          sql`${contentBlocks.id} != ${blockId}`
        )
      ).limit(1).then(rows => rows[0] || null);

      if (existing) {
        return Errors.badRequest('Content block with this slug already exists');
      }
    }

    const updated = await db
      .update(contentBlocks)
      .set(updateData)
      .where(eq(contentBlocks.id, blockId))
      .returning();

    return successResponse(updated[0]);
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/content-blocks/:blockId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const blockId = params?.blockId;
    if (!blockId) return Errors.badRequest('Block ID required');

    const block = await db.select().from(contentBlocks).where(
      and(
        eq(contentBlocks.id, blockId),
        eq(contentBlocks.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!block) {
      return Errors.notFound('Content block');
    }

    await db.delete(contentBlocks).where(eq(contentBlocks.id, blockId));

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'posts:delete',
    requireOrgAccess: true,
  }
);

