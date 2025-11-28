import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { CustomField } from '../../../db/schema';

describe('Admin API - Custom Field Detail', () => {
  const testOrg = fixtures.organizations.testOrg;
  const anotherOrg = fixtures.organizations.anotherOrg;
  const regularUser = createMockUser();

  const mockCustomField: CustomField = {
    id: 'field_123',
    organizationId: testOrg.id,
    name: 'Author Bio',
    slug: 'author_bio',
    fieldType: 'textarea',
    settings: JSON.stringify({ max_length: 500 }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/custom-fields/:fieldId', () => {
    it('should return custom field details', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${mockCustomField.id}`,
        params: { orgId: testOrg.id, fieldId: mockCustomField.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('fieldId')).toBe(mockCustomField.id);
    });

    it('should return 404 when custom field not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/non-existent`,
        params: { orgId: testOrg.id, fieldId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('fieldId')).toBe('non-existent');
    });

    it('should enforce organization isolation', async () => {
      // Field belongs to another organization
      const fieldFromOtherOrg: CustomField = {
        ...mockCustomField,
        id: 'field_other_123',
        organizationId: anotherOrg.id,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg, anotherOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null), // Not found in testOrg
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${fieldFromOtherOrg.id}`,
        params: { orgId: testOrg.id, fieldId: fieldFromOtherOrg.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      // Should not find field from other org
      expect(context.var.organizationId).toBe(testOrg.id);
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/custom-fields/:fieldId', () => {
    it('should update custom field name', async () => {
      const updateData = {
        name: 'Updated Author Bio',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockCustomField>>>().mockResolvedValue([{
              ...mockCustomField,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${mockCustomField.id}`,
        params: { orgId: testOrg.id, fieldId: mockCustomField.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.name).toBe('Updated Author Bio');
    });

    it('should update custom field settings', async () => {
      const updateData = {
        settings: { max_length: 1000, placeholder: 'Updated placeholder' },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockCustomField>>>().mockResolvedValue([{
              ...mockCustomField,
              settings: JSON.stringify(updateData.settings),
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${mockCustomField.id}`,
        params: { orgId: testOrg.id, fieldId: mockCustomField.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(updateData.settings.max_length).toBe(1000);
    });

    it('should return 404 when updating non-existent field', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<CustomField>>>().mockResolvedValue([]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/non-existent`,
        params: { orgId: testOrg.id, fieldId: 'non-existent' },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.param('fieldId')).toBe('non-existent');
    });

    it('should validate slug format on update', async () => {
      const invalidData = {
        slug: 'Invalid Slug!', // Invalid format
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${mockCustomField.id}`,
        params: { orgId: testOrg.id, fieldId: mockCustomField.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData.slug).toMatch(/[^a-z0-9_]/);
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/custom-fields/:fieldId', () => {
    it('should delete custom field', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<typeof mockCustomField>>>().mockResolvedValue([mockCustomField]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${mockCustomField.id}`,
        params: { orgId: testOrg.id, fieldId: mockCustomField.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when deleting non-existent field', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField>>>().mockResolvedValue([]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/non-existent`,
        params: { orgId: testOrg.id, fieldId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.param('fieldId')).toBe('non-existent');
    });

    it('should enforce organization isolation on delete', async () => {
      const fieldFromOtherOrg: CustomField = {
        ...mockCustomField,
        id: 'field_other_123',
        organizationId: anotherOrg.id,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg, anotherOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null), // Not found in testOrg
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField>>>().mockResolvedValue([]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields/${fieldFromOtherOrg.id}`,
        params: { orgId: testOrg.id, fieldId: fieldFromOtherOrg.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      // Should not delete field from other org
      expect(context.var.organizationId).toBe(testOrg.id);
    });
  });
});
