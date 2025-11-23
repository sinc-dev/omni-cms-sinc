import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { importOrganizationData } from '@/lib/import/import-manager';
import { z } from 'zod';

const importSchema = z.object({
  data: z.record(z.string(), z.unknown()), // JSON import data
  options: z.object({
    skipExisting: z.boolean().optional().default(false),
    importMedia: z.boolean().optional().default(false),
    dryRun: z.boolean().optional().default(false),
  }).optional(),
});

// POST /api/admin/v1/organizations/:orgId/import
// Import organization data
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const validation = await validateRequest(request, importSchema);
    if (!validation.success) return validation.response;

    const { data, options = {} } = validation.data;

    try {
      const result = await importOrganizationData(
        db,
        organizationId!,
        data,
        options
      );

      return successResponse(result);
    } catch (error) {
      return Errors.serverError(
        error instanceof Error ? error.message : 'Import failed'
      );
    }
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

