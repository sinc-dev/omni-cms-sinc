import type { DbClient } from '../../db/client';
import type { User, Organization } from '../../db/schema';
import { createMockUser, createMockSuperAdmin } from './mock-auth';

/**
 * Test data fixtures for database mocking
 */
export interface TestFixtures {
  users: User[];
  organizations: Organization[];
  // Add more fixture types as needed
}

/**
 * Creates default test fixtures
 */
export function createTestFixtures(): TestFixtures {
  const org1: Organization = {
    id: 'org_test_123',
    name: 'Test Organization',
    slug: 'test-org',
    domain: 'test.example.com',
    settings: '{}',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const org2: Organization = {
    id: 'org_test_456',
    name: 'Another Organization',
    slug: 'another-org',
    domain: 'another.example.com',
    settings: '{}',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  const user1 = createMockUser({
    id: 'user_test_123',
    email: 'user1@example.com',
  });

  const user2 = createMockUser({
    id: 'user_test_456',
    email: 'user2@example.com',
  });

  const admin = createMockSuperAdmin({
    id: 'user_admin_123',
    email: 'admin@example.com',
  });

  return {
    users: [user1, user2, admin],
    organizations: [org1, org2],
  };
}

/**
 * Mocks a database query result
 */
export function mockDbQuery<T>(result: T | T[] | null) {
  return {
    findFirst: async () => {
      if (Array.isArray(result)) {
        return result[0] || null;
      }
      return result;
    },
    findMany: async () => {
      if (Array.isArray(result)) {
        return result;
      }
      return result ? [result] : [];
    },
  };
}

/**
 * Creates a mock database client with query methods
 */
export function createMockDb(fixtures?: TestFixtures): any {
  const testFixtures = fixtures || createTestFixtures();

  return {
    query: {
      users: {
        findFirst: async (options?: any) => {
          // Mock user lookup logic
          if (options?.where) {
            // In real tests, this should evaluate the where clause
            return testFixtures.users[0] || null;
          }
          return testFixtures.users[0] || null;
        },
        findMany: async (options?: any) => {
          return testFixtures.users;
        },
      },
      organizations: {
        findFirst: async (options?: any) => {
          if (options?.where) {
            // In real tests, this should evaluate the where clause
            return testFixtures.organizations[0] || null;
          }
          return testFixtures.organizations[0] || null;
        },
        findMany: async (options?: any) => {
          return testFixtures.organizations;
        },
      },
      // Add more query mocks as needed
      posts: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
      postTypes: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
      taxonomies: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
      media: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
      apiKeys: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
      usersOrganizations: {
        findFirst: async () => null as any,
        findMany: async () => [] as any[],
      },
    },
    insert: (table: any) => ({
      values: (values: any) => ({
        returning: async () => [values],
      }),
    }),
    update: (table: any) => ({
      set: (values: any) => ({
        where: (condition: any) => ({
          returning: async () => [],
        }),
      }),
    }),
    delete: (table: any) => ({
      where: (condition: any) => ({
        returning: async () => [],
      }),
    }),
  };
}

/**
 * Helper to set up database with test data
 */
export async function setupTestDb(db: DbClient, fixtures?: TestFixtures): Promise<void> {
  const testFixtures = fixtures || createTestFixtures();
  
  // In integration tests, this would actually insert data
  // For unit tests, this is a no-op since we use mocks
}

/**
 * Helper to clean up test database
 */
export async function cleanupTestDb(db: DbClient): Promise<void> {
  // In integration tests, this would delete test data
  // For unit tests, this is a no-op since we use mocks
}