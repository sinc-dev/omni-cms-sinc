import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { createTaxonomyTermSchema } from '@/lib/validations/taxonomy';
import { taxonomyTerms, taxonomies } from '@/db/schema';

// GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    if (!taxonomyId) return Errors.badRequest('Taxonomy ID required');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: and(
        eq(taxonomies.id, taxonomyId),
        eq(taxonomies.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return Errors.notFound('Taxonomy');
    }

    // Fetch all terms for this taxonomy
    const terms = await db.query.taxonomyTerms.findMany({
      where: eq(taxonomyTerms.taxonomyId, taxonomyId),
      with: {
        parent: true,
        children: true,
      },
      orderBy: [taxonomyTerms.name],
    });

    return successResponse(terms);
  },
  {
    requiredPermission: 'taxonomies:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms
export const POST = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    if (!taxonomyId) return Errors.badRequest('Taxonomy ID required');

    // Verify taxonomy belongs to organization
    const taxonomy = await db.query.taxonomies.findFirst({
      where: and(
        eq(taxonomies.id, taxonomyId),
        eq(taxonomies.organizationId, organizationId!)
      ),
    });

    if (!taxonomy) {
      return Errors.notFound('Taxonomy');
    }

    const validation = await validateRequest(request, createTaxonomyTermSchema);
    if (!validation.success) return validation.response;

    const { name, slug, description, parentId } = validation.data;

    // Check if slug already exists in this taxonomy
    const existing = await db.query.taxonomyTerms.findFirst({
      where: and(
        eq(taxonomyTerms.taxonomyId, taxonomyId),
        eq(taxonomyTerms.slug, slug)
      ),
    });

    if (existing) {
      return Errors.badRequest('Term with this slug already exists in this taxonomy');
    }

    // If parentId provided, verify it exists in same taxonomy
    if (parentId) {
      const parent = await db.query.taxonomyTerms.findFirst({
        where: and(
          eq(taxonomyTerms.id, parentId),
          eq(taxonomyTerms.taxonomyId, taxonomyId)
        ),
      });
      
      if (!parent) {
        return Errors.badRequest('Parent term not found in this taxonomy');
      }
    }

    const newTerm = await db
      .insert(taxonomyTerms)
      .values({
        id: nanoid(),
        taxonomyId,
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const result = Array.isArray(newTerm) ? newTerm[0] : newTerm;
    return successResponse(result);
  },
  {
    requiredPermission: 'taxonomies:update', // Creating a term updates the taxonomy
    requireOrgAccess: true,
  }
);

