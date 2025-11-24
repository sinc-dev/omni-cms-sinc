import { Hono } from 'hono';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { importOrganizationData } from '../../lib/import/import-manager';

const app = new Hono<{ Bindings: CloudflareBindings }>();

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
app.post(
  '/:orgId/import',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);

    const body = await c.req.json().catch(() => ({}));
    const validation = importSchema.safeParse(body);
    
    if (!validation.success) {
      return c.json(Errors.validationError(validation.error.issues), 400);
    }

    const { data, options = {} } = validation.data;

    try {
      const result = await importOrganizationData(
        db,
        organizationId!,
        data,
        options
      );

      return c.json(successResponse(result));
    } catch (error) {
      console.error('Import error:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Import failed'
      ), 500);
    }
  }
);

export default app;

