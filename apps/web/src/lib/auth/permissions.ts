import { eq, and } from 'drizzle-orm';
import type { DbClient } from '@/db/client';
import { usersOrganizations, users } from '@/db/schema';
import { isSuperAdmin } from './middleware';

export type Permission = string; // Format: "resource:action" e.g., "posts:create"

/**
 * Checks if a user has a specific permission in an organization
 * @param db - The database client
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @param permission - The permission to check (e.g., "posts:create")
 * @returns True if the user has the permission
 */
export async function checkPermission(
  db: DbClient,
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  // Check if user is super admin (has all permissions)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user && isSuperAdmin(user)) {
    return true;
  }

  // Get user's role in the organization
  const userOrg = await db.query.usersOrganizations.findFirst({
    where: and(
      eq(usersOrganizations.userId, userId),
      eq(usersOrganizations.organizationId, organizationId)
    ),
    with: {
      role: true,
    },
  });

  if (!userOrg) {
    return false; // User not in organization
  }

  // Parse permissions from role
  const role = userOrg.role as { permissions: string };
  const permissions: Permission[] = JSON.parse(role.permissions);

  // Check for exact match or wildcard
  return permissions.some((p) => {
    if (p === permission) return true;

    // Check wildcard (e.g., "posts:*" matches "posts:create")
    const [resource, action] = p.split(':');
    const [reqResource] = permission.split(':');

    return resource === reqResource && action === '*';
  });
}

/**
 * Checks if a user has any of the specified permissions
 * @param db - The database client
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @param permissions - Array of permissions to check
 * @returns True if the user has at least one of the permissions
 */
export async function checkAnyPermission(
  db: DbClient,
  userId: string,
  organizationId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await checkPermission(db, userId, organizationId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a user has all of the specified permissions
 * @param db - The database client
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @param permissions - Array of permissions to check
 * @returns True if the user has all of the permissions
 */
export async function checkAllPermissions(
  db: DbClient,
  userId: string,
  organizationId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await checkPermission(db, userId, organizationId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Gets all permissions for a user in an organization
 * @param db - The database client
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Array of permissions
 */
export async function getUserPermissions(
  db: DbClient,
  userId: string,
  organizationId: string
): Promise<Permission[]> {
  // Check if user is super admin
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user && isSuperAdmin(user)) {
    return ['*:*']; // Super admin has all permissions
  }

  // Get user's role in the organization
  const userOrg = await db.query.usersOrganizations.findFirst({
    where: and(
      eq(usersOrganizations.userId, userId),
      eq(usersOrganizations.organizationId, organizationId)
    ),
    with: {
      role: true,
    },
  });

  if (!userOrg) {
    return [];
  }

  const role = userOrg.role as { permissions: string };
  return JSON.parse(role.permissions);
}
