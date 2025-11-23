import { eq, and, sql, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset } from '@/lib/api/validation';
import { createPostTypeSchema } from '@/lib/validations/post-type';
import { postTypes } from '@/db/schema';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/post-types - List post types
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;

    const whereClauses = [eq(postTypes.organizationId, organizationId!)];

    if (search) {
      whereClauses.push(like(postTypes.name, `%${search}%`));
    }

    const allTypes = await db.query.postTypes.findMany({
      where: and(...whereClauses),
      limit: perPage,
      offset,
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postTypes)
      .where(and(...whereClauses));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(allTypes, page, perPage, total);
  },
  {
    requiredPermission: 'post-types:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/post-types - Create post type
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createPostTypeSchema);
    if (!validation.success) return validation.response;

    const { name, slug, description, icon, isHierarchical, settings } = validation.data;

    // Check if slug already exists in this organization
    const existing = await db.query.postTypes.findFirst({
      where: and(
        eq(postTypes.organizationId, organizationId!),
        eq(postTypes.slug, slug)
      ),
    });

    if (existing) {
      return Errors.badRequest('Post type with this slug already exists in this organization');
    }

    const newType = await db
      .insert(postTypes)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        isHierarchical: isHierarchical || false,
        settings: settings ? JSON.stringify(settings) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newTypeArray = Array.isArray(newType) ? newType : [newType];
    if (newTypeArray.length === 0) {
      return Errors.serverError('Failed to create post type');
    }
    return successResponse(newTypeArray[0]);
  },
  {
    requiredPermission: 'post-types:create',
    requireOrgAccess: true,
  }
);

