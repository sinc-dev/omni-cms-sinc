import { Hono } from 'hono';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, getAuthContext, permissionMiddleware } from '../../lib/api/hono-admin-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { organizations } from '../../db/schema';
import type { Organization } from '../../db/schema/organizations';
import { eq } from 'drizzle-orm';
import { isSuperAdmin } from '../../lib/auth/middleware';
import { nanoid } from 'nanoid';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations - List organizations
app.get(
  '/',
  authMiddleware,
  async (c) => {
    const context = getAuthContext(c);
    const { db, user, apiKey, authMethod } = context;
    
    let orgs: Organization[] = [];
    
    // Check for API key first (even if authMethod says cloudflare-access)
    if (apiKey) {
      // For API key authentication, return the organization associated with the key
      const org = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, apiKey.organizationId),
      });
      if (org) {
        orgs = [org];
      }
    } else if (user) {
      // For Cloudflare Access, get user's organizations
      const userOrgs = await db.query.usersOrganizations.findMany({
        where: (uo, { eq }) => eq(uo.userId, user.id),
        with: {
          organization: true,
        },
      });
      orgs = userOrgs.map(uo => uo.organization);
    }
    
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

// POST /api/admin/v1/organizations - Create organization (Super Admin only)
const createOrgSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

app.post(
  '/',
  authMiddleware,
  async (c) => {
    const context = getAuthContext(c);
    const { db, user } = context;

    // Only super admins can create organizations
    if (!user || !isSuperAdmin(user)) {
      return c.json({
        ...Errors.forbidden(),
        error: {
          ...Errors.forbidden().error,
          message: 'Only super admins can create organizations',
        },
      });
    }

    try {
      const body = await c.req.json();
      const data = createOrgSchema.parse(body);

      // Check if slug already exists
      const existingOrg = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.slug, data.slug),
      });

      if (existingOrg) {
        return c.json(Errors.badRequest('Organization with this slug already exists'));
      }

      // Create organization
      const newOrg = await db.insert(organizations).values({
        id: nanoid(),
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        settings: data.settings ? JSON.stringify(data.settings) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // TODO: Auto-create default roles for new organization
      // This would require creating default roles in the roles table
      // and associating them with the new organization

      return c.json(successResponse(newOrg[0]), 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(Errors.validationError(error.issues));
      }
      throw error;
    }
  }
);

// PATCH /api/admin/v1/organizations/:orgId - Update organization
const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

app.patch(
  '/:orgId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const context = getAuthContext(c);
    const { db, organizationId, user } = context;

    // Super admins or org admins with organizations:update permission can update
    if (!user) {
      return c.json(Errors.unauthorized());
    }

    // Super admins can update any org, others need permission check (handled by middleware)
    try {
      const body = await c.req.json();
      const data = updateOrgSchema.parse(body);

      // Check if organization exists
      const existingOrg = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, organizationId!),
      });

      if (!existingOrg) {
        return c.json(Errors.notFound('Organization'));
      }

      // If slug is being changed, check uniqueness
      if (data.slug && data.slug !== existingOrg.slug) {
        // Check if slug exists for a different org
        const orgWithSlug = await db.query.organizations.findFirst({
          where: (orgs, { eq }) => eq(orgs.slug, data.slug!),
        });

        if (orgWithSlug && orgWithSlug.id !== organizationId) {
          return c.json(Errors.badRequest('Organization with this slug already exists'));
        }
      }

      // Update organization
      const updateData: Partial<typeof organizations.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.domain !== undefined) updateData.domain = data.domain;
      if (data.settings !== undefined) updateData.settings = JSON.stringify(data.settings);

      const updated = await db.update(organizations)
        .set(updateData)
        .where(eq(organizations.id, organizationId!))
        .returning();

      return c.json(successResponse(updated[0]));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(Errors.validationError(error.issues));
      }
      throw error;
    }
  }
);

// DELETE /api/admin/v1/organizations/:orgId - Delete organization (Super Admin only)
app.delete(
  '/:orgId',
  authMiddleware,
  async (c) => {
    const context = getAuthContext(c);
    const { db, organizationId, user } = context;

    // Only super admins can delete organizations
    if (!user || !isSuperAdmin(user)) {
      return c.json({
        ...Errors.forbidden(),
        error: {
          ...Errors.forbidden().error,
          message: 'Only super admins can delete organizations',
        },
      });
    }

    // Check if organization exists
    const existingOrg = await db.query.organizations.findFirst({
      where: (orgs, { eq }) => eq(orgs.id, organizationId!),
    });

    if (!existingOrg) {
      return c.json(Errors.notFound('Organization'));
    }

    // Delete organization (cascade will handle related data if foreign keys are set up)
    await db.delete(organizations)
      .where(eq(organizations.id, organizationId!));

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

