import { eq, and, sql } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { postTemplates } from '@/db/schema/post-templates';
import { z } from 'zod';

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  postTypeId: z.string().min(1).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/admin/v1/organizations/:orgId/templates/:templateId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const templateId = params?.templateId;
    if (!templateId) return Errors.badRequest('Template ID required');

    const template = await db.select().from(postTemplates).where(
      and(
        eq(postTemplates.id, templateId),
        eq(postTemplates.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!template) {
      return Errors.notFound('Template');
    }

    return successResponse(template);
  },
  {
    requiredPermission: 'posts:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/templates/:templateId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const templateId = params?.templateId;
    if (!templateId) return Errors.badRequest('Template ID required');

    const validation = await validateRequest(request, updateTemplateSchema);
    if (!validation.success) return validation.response;

    const template = await db.select().from(postTemplates).where(
      and(
        eq(postTemplates.id, templateId),
        eq(postTemplates.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!template) {
      return Errors.notFound('Template');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.slug) updateData.slug = validation.data.slug;
    if (validation.data.postTypeId) updateData.postTypeId = validation.data.postTypeId;
    if (validation.data.content) updateData.content = JSON.stringify(validation.data.content);
    if (validation.data.customFields !== undefined) {
      updateData.customFields = validation.data.customFields
        ? JSON.stringify(validation.data.customFields)
        : null;
    }

    // Check slug conflict if slug is being updated
    if (validation.data.slug && validation.data.slug !== template.slug) {
      const existing = await db.select().from(postTemplates).where(
        and(
          eq(postTemplates.organizationId, organizationId!),
          eq(postTemplates.slug, validation.data.slug),
          sql`${postTemplates.id} != ${templateId}`
        )
      ).limit(1).then(rows => rows[0] || null);

      if (existing) {
        return Errors.badRequest('Template with this slug already exists');
      }
    }

    const updated = await db
      .update(postTemplates)
      .set(updateData)
      .where(eq(postTemplates.id, templateId))
      .returning();

    return successResponse(updated[0]);
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/templates/:templateId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const templateId = params?.templateId;
    if (!templateId) return Errors.badRequest('Template ID required');

    const template = await db.select().from(postTemplates).where(
      and(
        eq(postTemplates.id, templateId),
        eq(postTemplates.organizationId, organizationId!)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!template) {
      return Errors.notFound('Template');
    }

    await db.delete(postTemplates).where(eq(postTemplates.id, templateId));

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'posts:delete',
    requireOrgAccess: true,
  }
);

