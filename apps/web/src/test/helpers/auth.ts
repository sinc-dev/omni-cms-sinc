import { nanoid } from 'nanoid';
import type { DbClient } from '@/db/client';
import { users, organizations, usersOrganizations, roles } from '@/db/schema';

/**
 * Creates a test user
 */
export async function createTestUser(
  db: DbClient,
  overrides?: Partial<typeof users.$inferInsert>
) {
  const userId = nanoid();
  await db.insert(users).values({
    id: userId,
    email: overrides?.email || `test-${nanoid()}@example.com`,
    name: overrides?.name || 'Test User',
    isSuperAdmin: overrides?.isSuperAdmin || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return userId;
}

/**
 * Creates a test organization
 */
export async function createTestOrganization(
  db: DbClient,
  overrides?: Partial<typeof organizations.$inferInsert>
) {
  const orgId = nanoid();
  await db.insert(organizations).values({
    id: orgId,
    name: overrides?.name || 'Test Organization',
    slug: overrides?.slug || `test-org-${nanoid()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return orgId;
}

/**
 * Creates a test role with permissions
 */
export async function createTestRole(
  db: DbClient,
  organizationId: string,
  permissions: string[] = ['posts:read', 'posts:create', 'posts:update', 'posts:delete']
) {
  const roleId = nanoid();
  await db.insert(roles).values({
    id: roleId,
    name: `Test Role ${nanoid()}`, // Make unique since name is unique
    description: 'Test role for testing',
    permissions: JSON.stringify(permissions),
    createdAt: new Date(),
  });

  return roleId;
}

/**
 * Assigns a user to an organization with a role
 */
export async function assignUserToOrganization(
  db: DbClient,
  userId: string,
  organizationId: string,
  roleId: string
) {
  await db.insert(usersOrganizations).values({
    id: nanoid(),
    userId,
    organizationId,
    roleId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Creates a complete test setup: user, org, role, and assignment
 */
export async function createTestSetup(
  db: DbClient,
  permissions: string[] = ['posts:read', 'posts:create', 'posts:update', 'posts:delete']
) {
  const userId = await createTestUser(db);
  const orgId = await createTestOrganization(db);
  const roleId = await createTestRole(db, orgId, permissions);
  await assignUserToOrganization(db, userId, orgId, roleId);

  return { userId, orgId, roleId };
}

