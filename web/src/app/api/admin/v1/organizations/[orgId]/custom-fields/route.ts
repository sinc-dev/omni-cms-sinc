import { eq, and, sql, like, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset, buildSearchCondition, parseSortParam } from '@/lib/api/validation';
import { createCustomFieldSchema } from '@/lib/validations/post-type';
import { customFields } from '@/db/schema';

export const runtime = 'edge';

// GET /api/admin/v1/organizations/:orgId/custom-fields - List custom fields
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;
    const fieldType = url.searchParams.get('field_type') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

    const whereClauses = [eq(customFields.organizationId, organizationId!)];

    if (search) {
      // Search name (most common use case)
      whereClauses.push(like(customFields.name, `%${search}%`));
    }

    if (fieldType) {
      whereClauses.push(eq(customFields.fieldType, fieldType));
    }

    const orderBy = parseSortParam(sort, {
      createdAt: customFields.createdAt,
      updatedAt: customFields.updatedAt,
      name: customFields.name,
      slug: customFields.slug,
    }, 'createdAt', 'desc');

    const allFields = await db.query.customFields.findMany({
      where: and(...whereClauses),
      limit: perPage,
      offset,
      orderBy,
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customFields)
      .where(and(...whereClauses));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(allFields, page, perPage, total);
  },
  {
    requiredPermission: 'custom-fields:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/custom-fields - Create custom field
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createCustomFieldSchema);
    if (!validation.success) return validation.response;

    const { name, slug, fieldType, settings } = validation.data;

    // Check if slug already exists in this organization
    const existing = await db.query.customFields.findFirst({
      where: and(
        eq(customFields.organizationId, organizationId!),
        eq(customFields.slug, slug)
      ),
    });

    if (existing) {
      return Errors.badRequest('Custom field with this slug already exists in this organization');
    }

    const newField = await db
      .insert(customFields)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name,
        slug,
        fieldType,
        settings: settings ? JSON.stringify(settings) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newFieldArray = Array.isArray(newField) ? newField : [newField];
    if (newFieldArray.length === 0) {
      return Errors.serverError('Failed to create custom field');
    }
    return successResponse(newFieldArray[0]);
  },
  {
    requiredPermission: 'custom-fields:create',
    requireOrgAccess: true,
  }
);

