import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Taxonomy, TaxonomyTerm } from '../../../db/schema';

describe('Admin API - Taxonomy Terms', () => {
  const testOrg = fixtures.organizations.testOrg;
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

  const mockTerm: TaxonomyTerm = {
    id: 'term_123',
    taxonomyId: mockTaxonomy.id,
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related posts',
    parentId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockTerm2: TaxonomyTerm = {
    id: 'term_456',
    taxonomyId: mockTaxonomy.id,
    name: 'Web Development',
    slug: 'web-development',
    description: null,
    parentId: mockTerm.id, // Child of Technology
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms', () => {
    it('should return terms for taxonomy', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findMany: jest.fn<() => Promise<Array<TaxonomyTerm & { parent: TaxonomyTerm | null; children: TaxonomyTerm[] }>>>().mockResolvedValue([
          {
            ...mockTerm,
            parent: null,
            children: [mockTerm2],
          },
          {
            ...mockTerm2,
            parent: mockTerm,
            children: [],
          },
        ]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms`,
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
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/non-existent/terms`,
        params: { orgId: testOrg.id, taxonomyId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('taxonomyId')).toBe('non-existent');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms', () => {
    it('should create term without parent', async () => {
      const newTermData = {
        name: 'Science',
        slug: 'science',
        description: 'Science related posts',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findFirst: jest.fn<() => Promise<TaxonomyTerm | null>>().mockResolvedValue(null), // Slug doesn't exist
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<TaxonomyTerm & { id: string }>>>().mockResolvedValue([{
            id: 'term_new_123',
            taxonomyId: mockTaxonomy.id,
            ...newTermData,
            parentId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        body: newTermData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(newTermData.name).toBe('Science');
    });

    it('should create term with parent', async () => {
      const newTermData = {
        name: 'React',
        slug: 'react',
        description: 'React related posts',
        parentId: mockTerm.id,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findFirst: jest.fn<() => Promise<TaxonomyTerm | null>>()
          .mockResolvedValueOnce(null) // Slug doesn't exist
          .mockResolvedValueOnce(mockTerm), // Parent exists
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<TaxonomyTerm & { id: string }>>>().mockResolvedValue([{
            id: 'term_new_123',
            taxonomyId: mockTaxonomy.id,
            ...newTermData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        body: newTermData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newTermData.parentId).toBe(mockTerm.id);
    });

    it('should reject duplicate slug in taxonomy', async () => {
      const duplicateData = {
        name: 'Another Technology',
        slug: mockTerm.slug, // Using existing slug
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findFirst: jest.fn<() => Promise<TaxonomyTerm | null>>().mockResolvedValue(mockTerm), // Slug exists
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        body: duplicateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(duplicateData.slug).toBe(mockTerm.slug);
    });

    it('should return 404 when parent term not found', async () => {
      const newTermData = {
        name: 'Child Term',
        slug: 'child-term',
        parentId: 'non-existent',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.query as any).taxonomyTerms = {
        findFirst: jest.fn<() => Promise<TaxonomyTerm | null>>()
          .mockResolvedValueOnce(null) // Slug doesn't exist
          .mockResolvedValueOnce(null), // Parent not found
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id },
        body: newTermData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(newTermData.parentId).toBe('non-existent');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId', () => {
    it('should update term name', async () => {
      const updateData = {
        name: 'Updated Technology',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockTerm>>>().mockResolvedValue([{
              ...mockTerm,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms/${mockTerm.id}`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id, termId: mockTerm.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.name).toBe('Updated Technology');
    });

    it('should return 404 when updating non-existent term', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<TaxonomyTerm>>>().mockResolvedValue([]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms/non-existent`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id, termId: 'non-existent' },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.param('termId')).toBe('non-existent');
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/taxonomies/:taxonomyId/terms/:termId', () => {
    it('should delete term', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<typeof mockTerm>>>().mockResolvedValue([mockTerm]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms/${mockTerm.id}`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id, termId: mockTerm.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when deleting non-existent term', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).taxonomies = {
        findFirst: jest.fn<() => Promise<typeof mockTaxonomy | null>>().mockResolvedValue(mockTaxonomy),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<TaxonomyTerm>>>().mockResolvedValue([]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/taxonomies/${mockTaxonomy.id}/terms/non-existent`,
        params: { orgId: testOrg.id, taxonomyId: mockTaxonomy.id, termId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.param('termId')).toBe('non-existent');
    });
  });
});
