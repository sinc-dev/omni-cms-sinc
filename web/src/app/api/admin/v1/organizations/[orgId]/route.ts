import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updateOrganizationSchema } from '@/lib/validations/organization';
import { organizations } from '@/db/schema';
import { isSuperAdmin } from '@/lib/auth/middleware';

// GET /api/admin/v1/organizations/:orgId
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId!),
    });

    if (!org) {
      return Errors.notFound('Organization');
    }

    return successResponse(org);
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId
export const PATCH = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, updateOrganizationSchema);
    if (!validation.success) return validation.response;

    // Check slug conflict if slug is being updated
    if (validation.data.slug) {
      const existing = await db.query.organizations.findFirst({
        where: and(
          eq(organizations.slug, validation.data.slug),
          sql`${organizations.id} != ${organizationId!}`
        ),
      });

      if (existing) {
        return Errors.badRequest('Organization with this slug already exists');
      }
    }

    const updated = await db
      .update(organizations)
      .set({
        ...validation.data,
        settings: validation.data.settings
          ? JSON.stringify(validation.data.settings)
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId!))
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Organization');
    }

    const updatedResult = updatedArray[0];
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId (super admin only)
export const DELETE = withAuth(async (request, { db, user, organizationId }) => {
  if (!isSuperAdmin(user)) {
    return Errors.forbidden();
  }

  await db.delete(organizations).where(eq(organizations.id, organizationId!));

  return successResponse({ deleted: true });
});
