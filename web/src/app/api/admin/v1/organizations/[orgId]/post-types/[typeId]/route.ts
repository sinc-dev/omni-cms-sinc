import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updatePostTypeSchema } from '@/lib/validations/post-type';
import { postTypes } from '@/db/schema';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/post-types/:typeId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const typeId = params?.typeId;
    if (!typeId) return Errors.badRequest('Post Type ID required');

    const type = await db.query.postTypes.findFirst({
      where: and(
        eq(postTypes.id, typeId),
        eq(postTypes.organizationId, organizationId!)
      ),
    });

    if (!type) {
      return Errors.notFound('Post Type');
    }

    return successResponse(type);
  },
  {
    requiredPermission: 'post-types:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/post-types/:typeId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const typeId = params?.typeId;
    if (!typeId) return Errors.badRequest('Post Type ID required');

    const validation = await validateRequest(request, updatePostTypeSchema);
    if (!validation.success) return validation.response;

    // Check slug conflict if slug is being updated
    if (validation.data.slug) {
      const existing = await db.query.postTypes.findFirst({
        where: and(
          eq(postTypes.organizationId, organizationId!),
          eq(postTypes.slug, validation.data.slug),
          sql`${postTypes.id} != ${typeId}`
        ),
      });

      if (existing) {
        return Errors.badRequest('Post type with this slug already exists in this organization');
      }
    }

    const updated = await db
      .update(postTypes)
      .set({
        ...validation.data,
        settings: validation.data.settings
          ? JSON.stringify(validation.data.settings)
          : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(postTypes.id, typeId),
          eq(postTypes.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Post Type');
    }

    const updatedResult = updatedArray[0];
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'post-types:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/post-types/:typeId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const typeId = params?.typeId;
    if (!typeId) return Errors.badRequest('Post Type ID required');

    const deleted = await db
      .delete(postTypes)
      .where(
        and(
          eq(postTypes.id, typeId),
          eq(postTypes.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return Errors.notFound('Post Type');
    }

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'post-types:delete',
    requireOrgAccess: true,
  }
);

