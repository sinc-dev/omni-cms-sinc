import { Hono } from 'hono';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { Errors } from '../../lib/api/hono-response';
import { generateExportFile } from '../../lib/export/export-manager';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const exportOptionsSchema = z.object({
  includePosts: z.boolean().optional().default(true),
  includeMedia: z.boolean().optional().default(true),
  includeTaxonomies: z.boolean().optional().default(true),
  includeCustomFields: z.boolean().optional().default(true),
  postTypeIds: z.array(z.string()).optional(),
});

// POST /api/admin/v1/organizations/:orgId/export
// Trigger export
app.post(
  '/:orgId/export',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);

    const body = await c.req.json().catch(() => ({}));
    const validation = exportOptionsSchema.safeParse(body);

    const options = validation.success ? validation.data : {};

    try {
      const exportData = await generateExportFile(db, organizationId!, options);

      return c.text(exportData, 200, {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="export-${organizationId}-${Date.now()}.json"`,
      });
    } catch (error) {
      console.error('Export error:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Export failed'
      ), 500);
    }
  }
);

export default app;

