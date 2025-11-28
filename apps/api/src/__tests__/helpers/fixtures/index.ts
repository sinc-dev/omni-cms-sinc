import type { User, Organization } from '../../../db/schema';

/**
 * Pre-defined test fixtures for common test scenarios
 */

export const fixtures = {
  users: {
    regular: {
      id: 'user_regular_123',
      email: 'user@example.com',
      name: 'Regular User',
      avatarUrl: null,
      isSuperAdmin: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    } as User,
    
    admin: {
      id: 'user_admin_123',
      email: 'admin@example.com',
      name: 'Admin User',
      avatarUrl: null,
      isSuperAdmin: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    } as User,
  },

  organizations: {
    testOrg: {
      id: 'org_test_123',
      name: 'Test Organization',
      slug: 'test-org',
      domain: 'test.example.com',
      settings: '{}',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    } as Organization,
    
    anotherOrg: {
      id: 'org_another_123',
      name: 'Another Organization',
      slug: 'another-org',
      domain: 'another.example.com',
      settings: '{}',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    } as Organization,
  },
};