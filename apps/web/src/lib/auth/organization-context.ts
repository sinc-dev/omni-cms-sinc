import { eq } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { organizations, usersOrganizations } from '@/db/schema';
import type { User, Organization } from '@/db/schema';
import { isSuperAdmin } from './middleware';

/**
 * Extracts organization ID from request URL or headers
 * @param request - The incoming request
 * @returns The organization ID or null
 */
export function getOrganizationIdFromRequest(request: Request): string | null {
  // Try to get from URL parameter (e.g., /api/admin/organizations/:orgId/...)
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const orgIndex = pathParts.indexOf('organizations');
  
  if (orgIndex !== -1 && pathParts[orgIndex + 1]) {
    return pathParts[orgIndex + 1];
  }

  // Try to get from custom header
  return request.headers.get('X-Organization-Id');
}

/**
 * Gets organization by slug
 * @param db - The database client
 * @param slug - The organization slug
 * @returns The organization or null
 */
export async function getOrganizationBySlug(
  db: DbClient,
  slug: string
): Promise<Organization | null> {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  return org || null;
}

/**
 * Checks if a user has access to an organization
 * @param db - The database client
 * @param user - The user
 * @param organizationId - The organization ID
 * @returns True if the user has access
 */
export async function userHasAccessToOrganization(
  db: DbClient,
  user: User,
  organizationId: string
): Promise<boolean> {
  // Super admins have access to all organizations
  if (isSuperAdmin(user)) {
    return true;
  }

  // Check if user is a member of the organization
  const userOrg = await db.query.usersOrganizations.findFirst({
    where: eq(usersOrganizations.userId, user.id) &&
           eq(usersOrganizations.organizationId, organizationId),
  });

  return !!userOrg;
}

/**
 * Gets all organizations a user has access to
 * @param db - The database client
 * @param user - The user
 * @returns Array of organizations with user's role
 */
interface Role {
  id: string;
  name: string;
  permissions: string;
}

export async function getUserOrganizations(
  db: DbClient,
  user: User
): Promise<Array<{ organization: Organization; role: Role }>> {
  // Super admins have access to all organizations
  if (isSuperAdmin(user)) {
    const allOrgs = await db.query.organizations.findMany();
    return allOrgs.map((org) => ({
      organization: org,
      role: { name: 'super_admin', permissions: ['*:*'] },
    }));
  }

  // Get user's organizations
  const userOrgs = await db.query.usersOrganizations.findMany({
    where: eq(usersOrganizations.userId, user.id),
    with: {
      organization: true,
      role: true,
    },
  });

  return userOrgs.map((uo) => ({
    organization: uo.organization as {
      id: string;
      name: string;
      slug: string;
      domain: string | null;
      settings: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    role: uo.role,
  }));
}
