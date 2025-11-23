import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updateCustomFieldSchema } from '@/lib/validations/post-type';
import { customFields } from '@/db/schema';

// GET /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const fieldId = params?.fieldId;
    if (!fieldId) return Errors.badRequest('Field ID required');

    const field = await db.query.customFields.findFirst({
      where: and(
        eq(customFields.id, fieldId),
        eq(customFields.organizationId, organizationId!)
      ),
    });

    if (!field) {
      return Errors.notFound('Custom Field');
    }

    return successResponse(field);
  },
  {
    requiredPermission: 'custom-fields:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const fieldId = params?.fieldId;
    if (!fieldId) return Errors.badRequest('Field ID required');

    const validation = await validateRequest(request, updateCustomFieldSchema);
    if (!validation.success) return validation.response;

    const updated = await db
      .update(customFields)
      .set({
        ...validation.data,
        settings: validation.data.settings
          ? JSON.stringify(validation.data.settings)
          : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customFields.id, fieldId),
          eq(customFields.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Custom Field');
    }

    const updatedResult = updatedArray[0];
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'custom-fields:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/custom-fields/:fieldId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const fieldId = params?.fieldId;
    if (!fieldId) return Errors.badRequest('Field ID required');

    const deleted = await db
      .delete(customFields)
      .where(
        and(
          eq(customFields.id, fieldId),
          eq(customFields.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return Errors.notFound('Custom Field');
    }

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'custom-fields:delete',
    requireOrgAccess: true,
  }
);

