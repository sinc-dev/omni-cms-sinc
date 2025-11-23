import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { generateExportFile } from '@/lib/export/export-manager';
import { z } from 'zod';

const exportOptionsSchema = z.object({
  includePosts: z.boolean().optional().default(true),
  includeMedia: z.boolean().optional().default(true),
  includeTaxonomies: z.boolean().optional().default(true),
  includeCustomFields: z.boolean().optional().default(true),
  postTypeIds: z.array(z.string()).optional(),
});

// POST /api/admin/v1/organizations/:orgId/export
// Trigger export
export const POST = withAuth(
  async (request, { db, organizationId }) => {
    const body = await request.json().catch(() => ({}));
    const validation = exportOptionsSchema.safeParse(body);

    const options = validation.success ? validation.data : {};

    try {
      const exportData = await generateExportFile(db, organizationId!, options);

      return new Response(exportData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${organizationId}-${Date.now()}.json"`,
        },
      });
    } catch (error) {
      return Errors.serverError(
        error instanceof Error ? error.message : 'Export failed'
      );
    }
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

