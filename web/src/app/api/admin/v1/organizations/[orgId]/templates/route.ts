import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset } from '@/lib/api/validation';
import { postTemplates } from '@/db/schema/post-templates';
import { z } from 'zod';

const createTemplateSchema = z.object({
  postTypeId: z.string().min(1, 'Post type is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.record(z.string(), z.unknown()), // JSON object with post data
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET /api/admin/v1/organizations/:orgId/templates
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);
    const postTypeId = url.searchParams.get('post_type') ?? undefined;

    const conditions = [eq(postTemplates.organizationId, organizationId!)];
    if (postTypeId) conditions.push(eq(postTemplates.postTypeId, postTypeId));

    const allTemplates = await db.select().from(postTemplates).where(
      and(...conditions)
    ).limit(perPage).offset(offset).orderBy(desc(postTemplates.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postTemplates)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(allTemplates, page, perPage, total);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/templates
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createTemplateSchema);
    if (!validation.success) return validation.response;

    // Check if slug already exists
    const existing = await db.select().from(postTemplates).where(
      and(
        eq(postTemplates.organizationId, organizationId!),
        eq(postTemplates.slug, validation.data.slug)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (existing) {
      return Errors.badRequest('Template with this slug already exists');
    }

    const newTemplate = await db
      .insert(postTemplates)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        postTypeId: validation.data.postTypeId,
        name: validation.data.name,
        slug: validation.data.slug,
        content: JSON.stringify(validation.data.content),
        customFields: validation.data.customFields
          ? JSON.stringify(validation.data.customFields)
          : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return successResponse(newTemplate[0]);
  },
  {
    requiredPermission: 'posts:create',
    requireOrgAccess: true,
  }
);

