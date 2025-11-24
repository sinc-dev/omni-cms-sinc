import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { postTemplates } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createTemplateSchema = z.object({
  postTypeId: z.string().min(1, 'Post type is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.record(z.string(), z.unknown()), // JSON object with post data
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/templates
app.get(
  '/:orgId/templates',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);
    const postTypeId = url.searchParams.get('post_type') ?? undefined;

    const conditions = [eq(postTemplates.organizationId, organizationId!)];
    if (postTypeId) conditions.push(eq(postTemplates.postTypeId, postTypeId));

    const allTemplates = await db
      .select()
      .from(postTemplates)
      .where(and(...conditions))
      .limit(perPage)
      .offset(offset)
      .orderBy(desc(postTemplates.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(postTemplates)
      .where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    return c.json(paginatedResponse(allTemplates, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/templates
app.post(
  '/:orgId/templates',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const templateData = createTemplateSchema.parse(body);

      // Check if slug already exists
      const existing = await db.query.postTemplates.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, organizationId!),
          eq(pt.slug, templateData.slug)
        ),
      });

      if (existing) {
        return c.json(Errors.badRequest('Template with this slug already exists'), 400);
      }

      const newTemplate = await db
        .insert(postTemplates)
        .values({
          id: nanoid(),
          organizationId: organizationId!,
          postTypeId: templateData.postTypeId,
          name: templateData.name,
          slug: templateData.slug,
          content: JSON.stringify(templateData.content),
          customFields: templateData.customFields
            ? JSON.stringify(templateData.customFields)
            : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(successResponse(newTemplate[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating template:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create template'
      ), 500);
    }
  }
);

export default app;

