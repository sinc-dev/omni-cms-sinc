import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse } from '../../lib/api/hono-response';
import { roles } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/roles - Get all available roles
app.get(
  '/roles',
  authMiddleware,
  async (c) => {
    const { db } = getAuthContext(c);

    const allRoles = await db.query.roles.findMany({
      orderBy: [roles.name],
    });

    return c.json(successResponse(allRoles));
  }
);

export default app;

