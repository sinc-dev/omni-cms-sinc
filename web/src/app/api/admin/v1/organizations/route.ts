import { eq, and, sql, like, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset, buildSearchCondition, parseSortParam } from '@/lib/api/validation';
import { createOrganizationSchema } from '@/lib/validations/organization';
import { organizations } from '@/db/schema';
import { isSuperAdmin } from '@/lib/auth/middleware';

export const runtime = 'edge';

// GET /api/admin/v1/organizations - List organizations (super admin only)
export const GET = withAuth(async (request, { db, user }) => {
  // Only super admins can list all organizations
  if (!isSuperAdmin(user)) {
    return Errors.forbidden();
  }

  const url = new URL(request.url);
  const { page, perPage } = getPaginationParams(url);
  const offset = getOffset(page, perPage);

  const search = url.searchParams.get('search') ?? undefined;
  const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

  const whereClauses = [];
  if (search) {
    // Search name (most common use case)
    whereClauses.push(like(organizations.name, `%${search}%`));
  }

  const orderBy = parseSortParam(sort, {
    createdAt: organizations.createdAt,
    updatedAt: organizations.updatedAt,
    name: organizations.name,
    slug: organizations.slug,
  }, 'createdAt', 'desc');

  const allOrgs = await db.query.organizations.findMany({
    where: whereClauses.length > 0 ? and(...whereClauses) : undefined,
    limit: perPage,
    offset,
    orderBy,
  });

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(organizations)
    .where(whereClauses.length > 0 ? and(...whereClauses) : undefined);
  const total = totalResult[0]?.count || 0;

  return paginatedResponse(allOrgs, page, perPage, total);
});

// POST /api/admin/v1/organizations - Create organization (super admin only)
export const POST = withAuth(async (request, { db, user }) => {
  // Only super admins can create organizations
  if (!isSuperAdmin(user)) {
    return Errors.forbidden();
  }

  const validation = await validateRequest(request, createOrganizationSchema);
  if (!validation.success) return validation.response;

  const { name, slug, domain, settings } = validation.data;

  // Check if slug already exists
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (existing) {
    return Errors.badRequest('Organization with this slug already exists');
  }

  const newOrg = await db
    .insert(organizations)
    .values({
      id: nanoid(),
      name,
      slug,
      domain: domain || null,
      settings: settings ? JSON.stringify(settings) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const newOrgArray = Array.isArray(newOrg) ? newOrg : [newOrg];
  if (newOrgArray.length === 0) {
    return Errors.serverError('Failed to create organization');
  }
  return successResponse(newOrgArray[0]);
});

