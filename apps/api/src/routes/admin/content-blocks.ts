import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { contentBlocks } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createContentBlockSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  blockType: z.enum(['text', 'image', 'video', 'gallery', 'cta', 'code', 'embed']),
  content: z.record(z.string(), z.unknown()), // JSON object
});

// GET /api/admin/v1/organizations/:orgId/content-blocks
app.get(
  '/:orgId/content-blocks',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const allBlocks = await db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.organizationId, organizationId!))
      .limit(perPage)
      .offset(offset)
      .orderBy(desc(contentBlocks.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentBlocks)
      .where(eq(contentBlocks.organizationId, organizationId!));
    const total = totalResult[0]?.count || 0;

    return c.json(paginatedResponse(allBlocks, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/content-blocks
app.post(
  '/:orgId/content-blocks',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:create'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const blockData = createContentBlockSchema.parse(body);

      // Check if slug already exists
      const existing = await db.query.contentBlocks.findFirst({
        where: (cb, { eq, and: andFn }) => andFn(
          eq(cb.organizationId, organizationId!),
          eq(cb.slug, blockData.slug)
        ),
      });

      if (existing) {
        return c.json(Errors.badRequest('Content block with this slug already exists'), 400);
      }

      const newBlock = await db
        .insert(contentBlocks)
        .values({
          id: nanoid(),
          organizationId: organizationId!,
          name: blockData.name,
          slug: blockData.slug,
          blockType: blockData.blockType,
          content: JSON.stringify(blockData.content),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return c.json(successResponse(newBlock[0]));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating content block:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create content block'
      ), 500);
    }
  }
);

export default app;

