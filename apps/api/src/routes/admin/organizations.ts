import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { organizations } from '../../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations - List organizations
app.get(
  '/',
  authMiddleware,
  async (c) => {
    const { db, user } = getAuthContext(c);
    
    // Get user's organizations
    const userOrgs = await db.query.usersOrganizations.findMany({
      where: (uo, { eq }) => eq(uo.userId, user.id),
      with: {
        organization: true,
      },
    });

    const orgs = userOrgs.map(uo => uo.organization);
    return c.json(successResponse(orgs));
  }
);

// GET /api/admin/v1/organizations/:orgId - Get organization details
app.get(
  '/:orgId',
  authMiddleware,
  orgAccessMiddleware,
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    const org = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.id, organizationId!),
    });

    if (!org) {
      return c.json(Errors.notFound('Organization'));
    }

    return c.json(successResponse(org));
  }
);

export default app;

