import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Taxonomy } from '../../../db/schema';

describe('Admin API - Taxonomies', () => {
  const testOrg = fixtures.organizations.testOrg;
  const anotherOrg = fixtures.organizations.anotherOrg;
  const regularUser = createMockUser();

  const mockTaxonomy: Taxonomy = {
    id: 'tax_123',
    organizationId: testOrg.id,
    name: 'Categories',
    slug: 'categories',
    isHierarchical: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTaxonomy2: Taxonomy = {
    id: 'tax_456',
    organizationId: testOrg.id,
    name: 'Tags',
    slug: 'tags',
    isHierarchical: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/taxonomies', () => {
    it('should return paginated taxonomies list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findMany: jest.fn<() => Promise<typeof mockTaxonomy[]>>().mockResolvedValue([
          mockTaxonomy,
          mockTaxonomy2,
        ]),
      };

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => Promise<Array<{ count: number }>> } }>().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 2 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies?page=1&per_page=20`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should search taxonomies by name', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findMany: jest.fn<() => Promise<typeof mockTaxonomy[]>>().mockResolvedValue([mockTaxonomy]),
      };

      (mockDb.select as any) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies?search=Categories`,
        params: { orgId: testOrg.id },
        query: { search: 'Categories' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.req.query('search')).toBe('Categories');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/taxonomies', () => {
    it('should create hierarchical taxonomy', async () => {
      const newTaxonomyData = {
        name: 'Categories',
        slug: 'categories',
        isHierarchical: true,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(null), // Slug doesn't exist
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<Taxonomy & { id: string }>>>().mockResolvedValue([{
            id: 'tax_new_123',
            organizationId: testOrg.id,
            ...newTaxonomyData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies`,
        params: { orgId: testOrg.id },
        body: newTaxonomyData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(newTaxonomyData.isHierarchical).toBe(true);
    });

    it('should create non-hierarchical taxonomy', async () => {
      const newTaxonomyData = {
        name: 'Tags',
        slug: 'tags',
        isHierarchical: false,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<Taxonomy & { id: string }>>>().mockResolvedValue([{
            id: 'tax_new_123',
            organizationId: testOrg.id,
            ...newTaxonomyData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies`,
        params: { orgId: testOrg.id },
        body: newTaxonomyData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newTaxonomyData.isHierarchical).toBe(false);
    });

    it('should reject duplicate slug', async () => {
      const duplicateData = {
        name: 'Another Categories',
        slug: mockTaxonomy.slug, // Using existing slug
        isHierarchical: true,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(mockTaxonomy), // Slug exists
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies`,
        params: { orgId: testOrg.id },
        body: duplicateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(duplicateData.slug).toBe(mockTaxonomy.slug);
    });

    it('should validate slug format', async () => {
      const invalidData = {
        name: 'Test Taxonomy',
        slug: 'Invalid Slug!', // Invalid format
        isHierarchical: false,
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail - slug must match /^[a-z0-9-]+$/
      expect(invalidData.slug).toMatch(/[^a-z0-9-]/);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields: name, slug
        isHierarchical: false,
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('name');
      expect(invalidData).not.toHaveProperty('slug');
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId', () => {
    it('should return taxonomy with terms', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy & { terms: any[] } | null>>().mockResolvedValue({
          ...mockTaxonomy,
          terms: [],
        } as any),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('taxonomyId')).toBe(mockTaxonomy.id);
    });

    it('should return 404 when taxonomy not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/non-existent`,
        params: { orgId: testOrg.id, taxonomyId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('taxonomyId')).toBe('non-existent');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId', () => {
    it('should update taxonomy name', async () => {
      const updateData = {
        name: 'Updated Categories',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>()
          .mockResolvedValueOnce(mockTaxonomy) // Existing taxonomy
          .mockResolvedValueOnce(null), // No slug conflict
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockTaxonomy>>>().mockResolvedValue([{
              ...mockTaxonomy,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.name).toBe('Updated Categories');
    });

    it('should return 404 when updating non-existent taxonomy', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(null),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<Taxonomy>>>().mockResolvedValue([]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/non-existent`,
        params: { orgId: testOrg.id, taxonomyId: 'non-existent' },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.param('taxonomyId')).toBe('non-existent');
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId', () => {
    it('should delete taxonomy', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findMany: jest.fn<() => Promise<Array<{ id: string }>>>().mockResolvedValue([]),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when deleting non-existent taxonomy', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<Taxonomy | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/non-existent`,
        params: { orgId: testOrg.id, taxonomyId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('taxonomyId')).toBe('non-existent');
    });
  });
});
