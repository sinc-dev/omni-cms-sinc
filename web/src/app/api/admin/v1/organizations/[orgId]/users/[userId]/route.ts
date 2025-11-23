import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { z } from 'zod';
import { usersOrganizations } from '@/db/schema';

const updateUserRoleSchema = z.object({
  roleId: z.string().min(1),
});

// GET /api/admin/v1/organizations/:orgId/users/:userId - Get user details in org
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const userId = params?.userId;
    if (!userId) return Errors.badRequest('User ID required');

    const member = await db.query.usersOrganizations.findFirst({
      where: and(
        eq(usersOrganizations.userId, userId),
        eq(usersOrganizations.organizationId, organizationId!)
      ),
      with: {
        user: true,
        role: true,
      },
    });

    if (!member) {
      return Errors.notFound('User not found in this organization');
    }

    return successResponse(member);
  },
  {
    requiredPermission: 'users:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/users/:userId - Update user role
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const userId = params?.userId;
    if (!userId) return Errors.badRequest('User ID required');

    const validation = await validateRequest(request, updateUserRoleSchema);
    if (!validation.success) return validation.response;

    const { roleId } = validation.data;

    const updated = await db
      .update(usersOrganizations)
      .set({
        roleId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(usersOrganizations.userId, userId),
          eq(usersOrganizations.organizationId, organizationId!)
        )
      )
      .returning();

    if (!updated.length) {
      return Errors.notFound('User not found in this organization');
    }

    return successResponse(updated[0]);
  },
  {
    requiredPermission: 'users:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/users/:userId - Remove user from org
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const userId = params?.userId;
    if (!userId) return Errors.badRequest('User ID required');

    const deleted = await db
      .delete(usersOrganizations)
      .where(
        and(
          eq(usersOrganizations.userId, userId),
          eq(usersOrganizations.organizationId, organizationId!)
        )
      )
      .returning();

    if (!deleted.length) {
      return Errors.notFound('User not found in this organization');
    }

    return successResponse({ removed: true });
  },
  {
    requiredPermission: 'users:delete',
    requireOrgAccess: true,
  }
);

