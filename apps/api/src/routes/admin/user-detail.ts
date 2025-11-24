import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { usersOrganizations } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateUserRoleSchema = z.object({
  roleId: z.string().min(1),
});

// GET /api/admin/v1/organizations/:orgId/users/:userId - Get user details in org
app.get(
  '/:orgId/users/:userId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('users:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const userId = c.req.param('userId');

    const member = await db.query.usersOrganizations.findFirst({
      where: (uo, { eq, and: andFn }) => andFn(
        eq(uo.userId, userId),
        eq(uo.organizationId, organizationId!)
      ),
      with: {
        user: true,
        role: true,
      },
    });

    if (!member) {
      return c.json(Errors.notFound('User not found in this organization'), 404);
    }

    return c.json(successResponse(member));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/users/:userId - Update user role
app.patch(
  '/:orgId/users/:userId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('users:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const userId = c.req.param('userId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateUserRoleSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const { roleId } = updateData;

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
      return c.json(Errors.notFound('User not found in this organization'), 404);
    }

    return c.json(successResponse(updated[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/users/:userId - Remove user from org
app.delete(
  '/:orgId/users/:userId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('users:delete'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const userId = c.req.param('userId');

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
      return c.json(Errors.notFound('User not found in this organization'), 404);
    }

    return c.json(successResponse({ removed: true }));
  }
);

export default app;

