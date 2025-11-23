import { eq, and, sql, like } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest, getPaginationParams, getOffset } from '@/lib/api/validation';
import { createTaxonomySchema } from '@/lib/validations/taxonomy';
import { taxonomies } from '@/db/schema';

// GET /api/admin/v1/organizations/:orgId/taxonomies - List taxonomies
export const GET = withAuth(
  async (request, { db, organizationId }) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const search = url.searchParams.get('search') ?? undefined;

    const whereClauses = [eq(taxonomies.organizationId, organizationId!)];

    if (search) {
      whereClauses.push(like(taxonomies.name, `%${search}%`));
    }

    const allTaxonomies = await db.query.taxonomies.findMany({
      where: and(...whereClauses),
      limit: perPage,
      offset,
      with: {
        // terms: true, // Optional: include terms count or list
      }
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(taxonomies)
      .where(and(...whereClauses));
    const total = totalResult[0]?.count || 0;

    return paginatedResponse(allTaxonomies, page, perPage, total);
  },
  {
    requiredPermission: 'taxonomies:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/taxonomies - Create taxonomy
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, createTaxonomySchema);
    if (!validation.success) return validation.response;

    const { name, slug, isHierarchical } = validation.data;

    // Check if slug already exists in this organization
    const existing = await db.query.taxonomies.findFirst({
      where: and(
        eq(taxonomies.organizationId, organizationId!),
        eq(taxonomies.slug, slug)
      ),
    });

    if (existing) {
      return Errors.badRequest('Taxonomy with this slug already exists in this organization');
    }

    const newTaxonomy = await db
      .insert(taxonomies)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name,
        slug,
        isHierarchical: isHierarchical || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const newTaxonomyArray = Array.isArray(newTaxonomy) ? newTaxonomy : [newTaxonomy];
    if (newTaxonomyArray.length === 0) {
      return Errors.serverError('Failed to create taxonomy');
    }
    return successResponse(newTaxonomyArray[0]);
  },
  {
    requiredPermission: 'taxonomies:create',
    requireOrgAccess: true,
  }
);

