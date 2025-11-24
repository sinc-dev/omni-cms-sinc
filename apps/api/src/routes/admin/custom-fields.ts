import { Hono } from 'hono';
import { eq, and, sql, like, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset, parseSortParam } from '../../lib/api/validation';
import { createCustomFieldSchema } from '../../lib/validations/post-type';
import { customFields } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/custom-fields - List custom fields
app.get(
  '/:orgId/custom-fields',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('custom-fields:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;
    const fieldType = url.searchParams.get('field_type') ?? undefined;
    const sort = url.searchParams.get('sort') ?? 'createdAt_desc';

    const whereClauses = [eq(customFields.organizationId, organizationId!)];

    if (search) {
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

    return c.json(paginatedResponse(allFields, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/custom-fields - Create custom field
app.post(
  '/:orgId/custom-fields',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('custom-fields:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const fieldData = createCustomFieldSchema.parse(body);
      const { name, slug, fieldType, settings } = fieldData;

      // Check if slug already exists in this organization
      const existing = await db.query.customFields.findFirst({
        where: (cf, { eq, and: andFn }) => andFn(
          eq(cf.organizationId, organizationId!),
          eq(cf.slug, slug)
        ),
      });

      if (existing) {
        return c.json(Errors.badRequest('Custom field with this slug already exists in this organization'), 400);
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
        return c.json(Errors.serverError('Failed to create custom field'), 500);
      }
      return c.json(successResponse(newFieldArray[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating custom field:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create custom field'
      ), 500);
    }
  }
);

export default app;

