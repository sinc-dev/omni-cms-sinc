import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset } from '@/lib/api/validation';
import { contentBlocks } from '@/db/schema/content-blocks';
import { z } from 'zod';

const createContentBlockSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  blockType: z.enum(['text', 'image', 'video', 'gallery', 'cta', 'code', 'embed']),
  content: z.record(z.string(), z.unknown()), // JSON object
});

const updateContentBlockSchema = createContentBlockSchema.partial();

// GET /api/admin/v1/organizations/:orgId/content-blocks
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const allBlocks = await db.select().from(contentBlocks).where(
      eq(contentBlocks.organizationId, organizationId!)
    ).limit(perPage).offset(offset).orderBy(desc(contentBlocks.createdAt));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentBlocks)
      .where(eq(contentBlocks.organizationId, organizationId!));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(allBlocks, page, perPage, total);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/content-blocks
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createContentBlockSchema);
    if (!validation.success) return validation.response;

    // Check if slug already exists
    const existing = await db.select().from(contentBlocks).where(
      and(
        eq(contentBlocks.organizationId, organizationId!),
        eq(contentBlocks.slug, validation.data.slug)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (existing) {
      return Errors.badRequest('Content block with this slug already exists');
    }

    const newBlock = await db
      .insert(contentBlocks)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name: validation.data.name,
        slug: validation.data.slug,
        blockType: validation.data.blockType,
        content: JSON.stringify(validation.data.content),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return successResponse(newBlock[0]);
  },
  {
    requiredPermission: 'posts:create',
    requireOrgAccess: true,
  }
);

