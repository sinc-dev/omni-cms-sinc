import type { User } from '../../db/schema';
import type { DbClient } from '../../db/client';

/**
 * Creates a mock user for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  const now = new Date();
  return {
    id: 'user_test_123',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    isSuperAdmin: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates a mock super admin user
 */
export function createMockSuperAdmin(overrides?: Partial<User>): User {
  return createMockUser({
    email: 'admin@example.com',
    name: 'Super Admin',
    isSuperAdmin: true,
    ...overrides,
  });
}

/**
 * Mocks Cloudflare Access JWT token validation
 */
export async function mockValidateAccessJWT(token: string): Promise<{
  email: string;
  name: string;
  sub: string;
}> {
  // Mock JWT payload
  return {
    email: 'user@example.com',
    name: 'Test User',
    sub: 'cloudflare-user-id-123',
  };
}

/**
 * Mocks API key validation
 */
export async function mockValidateApiKey(
  key: string,
  db: DbClient
): Promise<{
  id: string;
  organizationId: string;
  scopes: string[];
} | null> {
  // Simple mock - return null if key doesn't start with expected prefix
  if (!key.startsWith('Bearer omni_test_')) {
    return null;
  }

  // Extract key ID from mock format: Bearer omni_test_<keyId>
  const keyId = key.replace('Bearer omni_test_', '');

  // Mock API key structure
  return {
    id: keyId || 'api_key_123',
    organizationId: 'org_test_123',
    scopes: ['posts:read', 'posts:write'],
  };
}

/**
 * Mocks permission check
 */
export async function mockCheckPermission(
  userId: string,
  organizationId: string,
  permission: string,
  user?: User | null
): Promise<boolean> {
  // Super admins have all permissions
  if (user?.isSuperAdmin) {
    return true;
  }

  // Mock permission logic - return true for testing
  // In real tests, this should be customized per test case
  return true;
}

/**
 * Mocks organization access check
 */
export async function mockUserHasAccessToOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Mock - return true for testing
  // In real tests, this should be customized per test case
  return true;
}

/**
 * Creates mock Cloudflare Access headers
 */
export function createMockAccessHeaders(userEmail: string = 'test@example.com'): Record<string, string> {
  return {
    'Cf-Access-Jwt-Assertion': `mock-jwt-token-${userEmail}`,
  };
}

/**
 * Creates mock API key headers
 */
export function createMockApiKeyHeaders(apiKey: string = 'omni_test_123'): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Creates mock session token headers
 */
export function createMockSessionHeaders(sessionToken: string = 'session_test_123'): Record<string, string> {
  return {
    Authorization: `Bearer ${sessionToken}`,
  };
}