import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updateTaxonomyTermSchema } from '@/lib/validations/taxonomy';
import { taxonomyTerms, taxonomies } from '@/db/schema';

export const runtime = 'edge';

// PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    const termId = params?.termId;
    if (!taxonomyId || !termId) return Errors.badRequest('IDs required');

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

    const validation = await validateRequest(request, updateTaxonomyTermSchema);
    if (!validation.success) return validation.response;

    const updated = await db
      .update(taxonomyTerms)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taxonomyTerms.id, termId),
          eq(taxonomyTerms.taxonomyId, taxonomyId)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Term');
    }

    const updatedResult = updatedArray[0];
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'taxonomies:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    const termId = params?.termId;
    if (!taxonomyId || !termId) return Errors.badRequest('IDs required');

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

    const deleted = await db
      .delete(taxonomyTerms)
      .where(
        and(
          eq(taxonomyTerms.id, termId),
          eq(taxonomyTerms.taxonomyId, taxonomyId)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return Errors.notFound('Term');
    }

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'taxonomies:update',
    requireOrgAccess: true,
  }
);

