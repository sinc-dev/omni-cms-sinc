import { Hono } from 'hono';
import { eq, and, sql, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { createPostTypeSchema } from '../../lib/validations/post-type';
import { postTypes } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/post-types - List post types
app.get(
  '/:orgId/post-types',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
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

    return c.json(paginatedResponse(allTypes, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/post-types - Create post type
app.post(
  '/:orgId/post-types',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('post-types:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const postTypeData = createPostTypeSchema.parse(body);
      const { name, slug, description, icon, isHierarchical, settings } = postTypeData;

      // Check if slug already exists in this organization
      const existing = await db.query.postTypes.findFirst({
        where: and(
          eq(postTypes.organizationId, organizationId!),
          eq(postTypes.slug, slug)
        ),
      });

      if (existing) {
        return c.json(Errors.badRequest('Post type with this slug already exists in this organization'), 400);
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
        return c.json(Errors.serverError('Failed to create post type'), 500);
      }
      return c.json(successResponse(newTypeArray[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating post type:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create post type'
      ), 500);
    }
  }
);

export default app;

