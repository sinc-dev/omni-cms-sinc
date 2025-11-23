import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { updateTaxonomySchema } from '@/lib/validations/taxonomy';
import { taxonomies, organizations } from '@/db/schema';
import { invalidateTaxonomyCache } from '@/lib/cache/invalidation';

// GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    if (!taxonomyId) return Errors.badRequest('Taxonomy ID required');

    const taxonomy = await db.query.taxonomies.findFirst({
      where: and(
        eq(taxonomies.id, taxonomyId),
        eq(taxonomies.organizationId, organizationId!)
      ),
      with: {
        terms: true, // Include terms for detail view
      },
    });

    if (!taxonomy) {
      return Errors.notFound('Taxonomy');
    }

    return successResponse(taxonomy);
  },
  {
    requiredPermission: 'taxonomies:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    if (!taxonomyId) return Errors.badRequest('Taxonomy ID required');

    const validation = await validateRequest(request, updateTaxonomySchema);
    if (!validation.success) return validation.response;

    // Check slug conflict if slug is being updated
    if (validation.data.slug) {
      const existing = await db.query.taxonomies.findFirst({
        where: and(
          eq(taxonomies.organizationId, organizationId!),
          eq(taxonomies.slug, validation.data.slug),
          sql`${taxonomies.id} != ${taxonomyId}`
        ),
      });

      if (existing) {
        return Errors.badRequest('Taxonomy with this slug already exists in this organization');
      }
    }

    const updated = await db
      .update(taxonomies)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(taxonomies.id, taxonomyId),
          eq(taxonomies.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('Taxonomy');
    }

    const updatedResult = updatedArray[0];
    
    // Invalidate cache for taxonomy-related endpoints
    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId!),
      });
      
      if (org && updatedResult.slug) {
        await invalidateTaxonomyCache(org.slug, updatedResult.slug);
      }
    } catch (error) {
      // Don't fail the request if cache invalidation fails
      console.error('Failed to invalidate cache:', error);
    }
    
    return successResponse(updatedResult);
  },
  {
    requiredPermission: 'taxonomies:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const taxonomyId = params?.taxonomyId;
    if (!taxonomyId) return Errors.badRequest('Taxonomy ID required');

    // Get taxonomy info before deletion for cache invalidation
    const taxonomy = await db.query.taxonomies.findFirst({
      where: and(
        eq(taxonomies.id, taxonomyId),
        eq(taxonomies.organizationId, organizationId!)
      ),
    });

    const deleted = await db
      .delete(taxonomies)
      .where(
        and(
          eq(taxonomies.id, taxonomyId),
          eq(taxonomies.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return Errors.notFound('Taxonomy');
    }

    // Invalidate cache for taxonomy-related endpoints
    if (taxonomy) {
      try {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organizationId!),
        });
        
        if (org && taxonomy.slug) {
          await invalidateTaxonomyCache(org.slug, taxonomy.slug);
        }
      } catch (error) {
        // Don't fail the request if cache invalidation fails
        console.error('Failed to invalidate cache:', error);
      }
    }

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'taxonomies:delete',
    requireOrgAccess: true,
  }
);

