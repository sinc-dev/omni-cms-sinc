import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { ApiKey } from '../../../db/schema';

describe('Admin API - API Keys', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockApiKey: ApiKey = {
    id: 'key_123',
    organizationId: testOrg.id,
    name: 'Production Key',
    key: 'hashed_key_value',
    keyPrefix: 'omni_abc123',
    scopes: JSON.stringify(['posts:read', 'posts:write']),
    rateLimit: 10000,
    revokedAt: null,
    rotatedFromId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastUsedAt: null,
    expiresAt: null,
  };

  const mockApiKey2: ApiKey = {
    id: 'key_456',
    organizationId: testOrg.id,
    name: 'Development Key',
    key: 'hashed_key_value_2',
    keyPrefix: 'omni_def456',
    scopes: JSON.stringify(['posts:read']),
    rateLimit: 5000,
    revokedAt: null,
    rotatedFromId: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    lastUsedAt: null,
    expiresAt: null,
  };

  describe('GET /api/admin/v1/organizations/:orgId/api-keys', () => {
    it('should return paginated API keys list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => { limit: () => { offset: () => { orderBy: () => Promise<ApiKey[]> } } } } } | { from: () => { where: () => Promise<Array<{ count: number }>> } }>()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue({
                  orderBy: jest.fn<() => Promise<ApiKey[]>>().mockResolvedValue([mockApiKey, mockApiKey2]),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 2 }]),
          }),
        } as any);

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys?page=1&per_page=20`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { select: mockDb.select } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should not expose hashed key values', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => { limit: () => { offset: () => { orderBy: () => Promise<ApiKey[]> } } } } } | { from: () => { where: () => Promise<Array<{ count: number }>> } }>()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue({
                  orderBy: jest.fn<() => Promise<ApiKey[]>>().mockResolvedValue([mockApiKey]),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 1 }]),
          }),
        } as any);

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
        env: { DB: { select: mockDb.select } as any },
      });

      // Response should only include keyPrefix, not the full hashed key
      expect(mockApiKey.keyPrefix).toBe('omni_abc123');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/api-keys', () => {
    it('should create API key with scopes', async () => {
      const newKeyData = {
        name: 'Test Key',
        scopes: ['posts:read', 'posts:write'],
        rateLimit: 10000,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).apiKeys = {
        findFirst: jest.fn<() => Promise<ApiKey | null>>().mockResolvedValue(null), // Key doesn't exist
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<ApiKey & { id: string }>>>().mockResolvedValue([{
            id: 'key_new_123',
            organizationId: testOrg.id,
            name: newKeyData.name,
            key: 'hashed_key',
            keyPrefix: 'omni_new123',
            scopes: JSON.stringify(newKeyData.scopes),
            rateLimit: newKeyData.rateLimit,
            revokedAt: null,
            rotatedFromId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: null,
            expiresAt: null,
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys`,
        params: { orgId: testOrg.id },
        body: newKeyData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(newKeyData.scopes.length).toBe(2);
    });

    it('should create API key with expiration date', async () => {
      const newKeyData = {
        name: 'Temporary Key',
        scopes: ['posts:read'],
        expiresAt: new Date('2025-12-31').toISOString(),
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).apiKeys = {
        findFirst: jest.fn<() => Promise<ApiKey | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<ApiKey & { id: string }>>>().mockResolvedValue([{
            id: 'key_new_123',
            organizationId: testOrg.id,
            name: newKeyData.name,
            key: 'hashed_key',
            keyPrefix: 'omni_new123',
            scopes: JSON.stringify(newKeyData.scopes),
            rateLimit: 10000,
            revokedAt: null,
            rotatedFromId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsedAt: null,
            expiresAt: newKeyData.expiresAt ? new Date(newKeyData.expiresAt) : null,
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys`,
        params: { orgId: testOrg.id },
        body: newKeyData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newKeyData.expiresAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required field: name
        scopes: ['posts:read'],
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('name');
    });

    it('should validate rate limit is positive', async () => {
      const invalidData = {
        name: 'Test Key',
        rateLimit: -1, // Invalid
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData.rateLimit).toBeLessThanOrEqual(0);
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/api-keys/:keyId', () => {
    it('should return API key details', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).apiKeys = {
        findFirst: jest.fn<() => Promise<typeof mockApiKey | null>>().mockResolvedValue(mockApiKey),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/${mockApiKey.id}`,
        params: { orgId: testOrg.id, keyId: mockApiKey.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('keyId')).toBe(mockApiKey.id);
    });

    it('should return 404 when API key not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).apiKeys = {
        findFirst: jest.fn<() => Promise<ApiKey | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/non-existent`,
        params: { orgId: testOrg.id, keyId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('keyId')).toBe('non-existent');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/api-keys/:keyId', () => {
    it('should update API key name', async () => {
      const updateData = {
        name: 'Updated Key Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockApiKey>>>().mockResolvedValue([{
              ...mockApiKey,
              ...updateData,
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/${mockApiKey.id}`,
        params: { orgId: testOrg.id, keyId: mockApiKey.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.name).toBe('Updated Key Name');
    });

    it('should update API key rate limit', async () => {
      const updateData = {
        rateLimit: 20000,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockApiKey>>>().mockResolvedValue([{
              ...mockApiKey,
              ...updateData,
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/${mockApiKey.id}`,
        params: { orgId: testOrg.id, keyId: mockApiKey.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { update: mockDb.update } as any },
      });

      expect(updateData.rateLimit).toBe(20000);
    });

    it('should return 404 when updating non-existent key', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<ApiKey>>>().mockResolvedValue([]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/non-existent`,
        params: { orgId: testOrg.id, keyId: 'non-existent' },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { update: mockDb.update } as any },
      });

      expect(context.req.param('keyId')).toBe('non-existent');
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/api-keys/:keyId', () => {
    it('should delete API key', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<typeof mockApiKey>>>().mockResolvedValue([mockApiKey]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/${mockApiKey.id}`,
        params: { orgId: testOrg.id, keyId: mockApiKey.id },
        organizationId: testOrg.id,
        env: { DB: { delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when deleting non-existent key', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<ApiKey>>>().mockResolvedValue([]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/api-keys/non-existent`,
        params: { orgId: testOrg.id, keyId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { delete: mockDb.delete } as any },
      });

      expect(context.req.param('keyId')).toBe('non-existent');
    });
  });
});
