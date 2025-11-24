import { Hono } from 'hono';
import { eq, and, sql, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { usersOrganizations, users, roles } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const addUserSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
});

// GET /api/admin/v1/organizations/:orgId/users - List users in organization
app.get(
  '/:orgId/users',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('users:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;
    const roleId = url.searchParams.get('role_id') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

    // Build where conditions
    const whereConditions = [eq(usersOrganizations.organizationId, organizationId!)];
    
    if (roleId) {
      whereConditions.push(eq(usersOrganizations.roleId, roleId));
    }

    const orgUsers = await db.query.usersOrganizations.findMany({
      where: and(...whereConditions),
      limit: perPage,
      offset,
      with: {
        user: true,
        role: true,
      },
    });

    // Filter by search if provided (search in user name or email)
    let filteredUsers = orgUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = orgUsers.filter(
        (uo) => {
          const user = uo.user as { name: string; email: string };
          return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
          );
        }
      );
    }

    // Apply sorting
    const [sortField, sortOrder] = sort.split('_');
    if (sortField === 'name') {
      filteredUsers.sort((a, b) => {
        const userA = a.user as { name: string };
        const userB = b.user as { name: string };
        const cmp = userA.name.localeCompare(userB.name);
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    } else if (sortField === 'email') {
      filteredUsers.sort((a, b) => {
        const userA = a.user as { email: string };
        const userB = b.user as { email: string };
        const cmp = userA.email.localeCompare(userB.email);
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    } else {
      // Default: createdAt
      filteredUsers.sort((a, b) => {
        const aTime = a.createdAt?.getTime() || 0;
        const bTime = b.createdAt?.getTime() || 0;
        return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
      });
    }

    // Get total count (for search, we need to count filtered results)
    let total = 0;
    if (search) {
      total = filteredUsers.length;
      // Re-slice for pagination after filtering
      const start = offset;
      const end = start + perPage;
      filteredUsers = filteredUsers.slice(start, end);
    } else {
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersOrganizations)
        .where(and(...whereConditions));
      total = totalResult[0]?.count || 0;
    }

    return c.json(paginatedResponse(filteredUsers, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/users - Add user to organization
app.post(
  '/:orgId/users',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('users:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const userData = addUserSchema.parse(body);
      const { email, roleId } = userData;

      // 1. Find user by email
      const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });

      if (!user) {
        return c.json(Errors.notFound('User not found. User must log in at least once.'), 404);
      }

      // 2. Check if role exists
      const role = await db.query.roles.findFirst({
        where: (r, { eq }) => eq(r.id, roleId),
      });

      if (!role) {
        return c.json(Errors.notFound('Role'), 404);
      }

      // 3. Check if user is already in organization
      const existingMember = await db.query.usersOrganizations.findFirst({
        where: (uo, { eq, and: andFn }) => andFn(
          eq(uo.userId, user.id),
          eq(uo.organizationId, organizationId!)
        ),
      });

      if (existingMember) {
        return c.json(Errors.badRequest('User is already a member of this organization'), 400);
      }

      // 4. Add user to organization
      const newMember = await db
        .insert(usersOrganizations)
        .values({
          id: nanoid(),
          userId: user.id,
          organizationId: organizationId!,
          roleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(successResponse(newMember[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error adding user to organization:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to add user to organization'
      ), 500);
    }
  }
);

export default app;

