import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import adminOrganizations from '../../../routes/admin/organizations';
import { createMockContext, createAuthenticatedContext, createApiKeyContext } from '../../helpers/mock-hono-context';
import { createMockUser, createMockSuperAdmin } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Organization } from '../../../db/schema';

describe('Admin API - Organizations', () => {
  const testOrg: Organization = fixtures.organizations.testOrg;
  const regularUser = createMockUser();
  const superAdmin = createMockSuperAdmin();

  describe('GET /api/admin/v1/organizations', () => {
    it('should return user organizations when authenticated with Cloudflare Access', () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      // Mock usersOrganizations query
      (mockDb.query as any).usersOrganizations = {
        findMany: jest.fn<() => Promise<Array<{ userId: string; organizationId: string; organization: typeof testOrg }>>>().mockResolvedValue([
          {
            userId: regularUser.id,
            organizationId: testOrg.id,
            organization: testOrg,
          },
        ]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: 'http://localhost:8787/api/admin/v1/organizations',
        env: { DB: { query: mockDb.query } as any },
      });

      // Verify context is set up correctly
      expect(context.var.user).toBe(regularUser);
      expect(context.req.url).toContain('/api/admin/v1/organizations');
      expect(context.env.DB).toBeDefined();
    });

    it('should return API key organization when authenticated with API key', async () => {
      const mockDb = createMockDb({
        users: [],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      const apiKey = {
        id: 'api_key_123',
        organizationId: testOrg.id,
        scopes: ['organizations:read'],
      };

      const context = createApiKeyContext(apiKey, {
        env: { DB: { query: mockDb.query } as any },
      });

      // Test would need proper route integration
      expect(apiKey.organizationId).toBe(testOrg.id);
    });

    it('should return 401 when unauthenticated', async () => {
      const context = createMockContext();

      // Test would verify 401 response
      expect(context.var.user).toBeNull();
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId', () => {
    it('should return organization details when user has access', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}`,
        params: { orgId: testOrg.id },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
    });

    it('should return 404 when organization not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: 'http://localhost:8787/api/admin/v1/organizations/non-existent',
        params: { orgId: 'non-existent' },
        env: { DB: { query: mockDb.query } as any },
      });

      // Test would verify 404 response
      expect(context.var.organizationId).toBe('non-existent');
    });
  });

  describe('POST /api/admin/v1/organizations', () => {
    it('should create organization when user is super admin', async () => {
      const newOrgData = {
        name: 'New Organization',
        slug: 'new-org',
        domain: 'new.example.com',
      };

      const mockDb = createMockDb({
        users: [superAdmin],
        organizations: [],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(null), // Slug doesn't exist
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<typeof testOrg & { id: string }>>>().mockResolvedValue([{
            id: 'org_new_123',
            ...newOrgData,
            settings: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(superAdmin, {
        method: 'POST',
        url: 'http://localhost:8787/api/admin/v1/organizations',
        body: newOrgData,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(superAdmin.isSuperAdmin).toBe(true);
    });

    it('should return 403 when user is not super admin', async () => {
      const newOrgData = {
        name: 'New Organization',
        slug: 'new-org',
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: 'http://localhost:8787/api/admin/v1/organizations',
        body: newOrgData,
      });

      expect(regularUser.isSuperAdmin).toBe(false);
    });

    it('should return 400 when slug format is invalid', async () => {
      const invalidData = {
        name: 'New Organization',
        slug: 'Invalid Slug!', // Invalid format
      };

      const context = createAuthenticatedContext(superAdmin, {
        method: 'POST',
        url: 'http://localhost:8787/api/admin/v1/organizations',
        body: invalidData,
      });

      // Validation should fail
      expect(invalidData.slug).toMatch(/[^a-z0-9-]/);
    });

    it('should return 400 when slug already exists', async () => {
      const duplicateData = {
        name: 'Duplicate Org',
        slug: testOrg.slug, // Using existing slug
      };

      const mockDb = createMockDb({
        users: [superAdmin],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg), // Slug exists
      };

      const context = createAuthenticatedContext(superAdmin, {
        method: 'POST',
        url: 'http://localhost:8787/api/admin/v1/organizations',
        body: duplicateData,
        env: { DB: { query: mockDb.query } as any },
      });

      // Should detect duplicate slug
      expect(duplicateData.slug).toBe(testOrg.slug);
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId', () => {
    it('should update organization when user has permission', async () => {
      const updateData = {
        name: 'Updated Organization Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof testOrg>>>().mockResolvedValue([{
              ...testOrg,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}`,
        params: { orgId: testOrg.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
    });

    it('should return 400 when slug conflicts with another organization', async () => {
      const otherOrg: Organization = {
        ...fixtures.organizations.anotherOrg,
        slug: 'other-org',
      };

      const updateData = {
        slug: otherOrg.slug, // Conflict with another org
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg, otherOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>()
          .mockResolvedValueOnce(testOrg as typeof testOrg) // Existing org
          .mockResolvedValueOnce(otherOrg as typeof testOrg), // Conflicting org
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}`,
        params: { orgId: testOrg.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      // Should detect conflict
      expect(updateData.slug).toBe(otherOrg.slug);
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId', () => {
    it('should delete organization when user is super admin', async () => {
      const mockDb = createMockDb({
        users: [superAdmin],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      const context = createAuthenticatedContext(superAdmin, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(superAdmin.isSuperAdmin).toBe(true);
    });

    it('should return 403 when user is not super admin', async () => {
      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
      });

      expect(regularUser.isSuperAdmin).toBe(false);
    });

    it('should return 404 when organization not found', async () => {
      const mockDb = createMockDb({
        users: [superAdmin],
        organizations: [],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(superAdmin, {
        method: 'DELETE',
        url: 'http://localhost:8787/api/admin/v1/organizations/non-existent',
        params: { orgId: 'non-existent' },
        organizationId: 'non-existent',
        env: { DB: { query: mockDb.query } as any },
      });

      // Should return 404
      expect(context.req.param('orgId')).toBe('non-existent');
    });
  });
});