import { eq, and, sql, like, desc, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset, buildSearchCondition, parseSortParam } from '@/lib/api/validation';
import { z } from 'zod';
import { usersOrganizations, users, roles } from '@/db/schema';

export const runtime = 'edge';

const addUserSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
});

// GET /api/admin/v1/organizations/:orgId/users - List users in organization
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;
    const roleId = url.searchParams.get('role_id') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

    // Build where conditions - need to join with users table for search
    const whereConditions = [eq(usersOrganizations.organizationId, organizationId!)];
    
    if (roleId) {
      whereConditions.push(eq(usersOrganizations.roleId, roleId));
    }

    // Note: Search requires a join, so we'll do it differently
    // For now, fetch and filter in memory if search is needed
    // In production, you'd want a proper join query

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

    return paginatedResponse(filteredUsers, page, perPage, total);
  },
  {
    requiredPermission: 'users:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/users - Add user to organization
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, addUserSchema);
    if (!validation.success) return validation.response;

    const { email, roleId } = validation.data;

    // 1. Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return Errors.notFound('User not found. User must log in at least once.');
    }

    // 2. Check if role exists
    const role = await db.query.roles.findFirst({
      where: eq(roles.id, roleId),
    });

    if (!role) {
      return Errors.notFound('Role');
    }

    // 3. Check if user is already in organization
    const existingMember = await db.query.usersOrganizations.findFirst({
      where: and(
        eq(usersOrganizations.userId, user.id),
        eq(usersOrganizations.organizationId, organizationId!)
      ),
    });

    if (existingMember) {
      return Errors.badRequest('User is already a member of this organization');
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

    return successResponse(newMember[0]);
  },
  {
    requiredPermission: 'users:create',
    requireOrgAccess: true,
  }
);

