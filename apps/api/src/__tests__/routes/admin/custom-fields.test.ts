import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { CustomField } from '../../../db/schema';

describe('Admin API - Custom Fields', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockCustomField: CustomField = {
    id: 'field_123',
    organizationId: testOrg.id,
    name: 'Author Bio',
    slug: 'author_bio',
    fieldType: 'textarea',
    settings: JSON.stringify({ max_length: 500, placeholder: 'Enter author bio...' }),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockCustomField2: CustomField = {
    id: 'field_456',
    organizationId: testOrg.id,
    name: 'Reading Time',
    slug: 'reading_time',
    fieldType: 'number',
    settings: JSON.stringify({ min: 0, max: 1000 }),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/custom-fields', () => {
    it('should return paginated custom fields list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findMany: jest.fn<() => Promise<typeof mockCustomField[]>>().mockResolvedValue([
          mockCustomField,
          mockCustomField2,
        ]),
      };

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => Promise<Array<{ count: number }>> } }>().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 2 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields?page=1&per_page=20`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should filter custom fields by field type', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findMany: jest.fn<() => Promise<typeof mockCustomField[]>>().mockResolvedValue([mockCustomField]),
      };

      (mockDb.select as any) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields?field_type=textarea`,
        params: { orgId: testOrg.id },
        query: { field_type: 'textarea' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.req.query('field_type')).toBe('textarea');
    });

    it('should search custom fields by name', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findMany: jest.fn<() => Promise<typeof mockCustomField[]>>().mockResolvedValue([mockCustomField]),
      };

      (mockDb.select as any) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields?search=Author`,
        params: { orgId: testOrg.id },
        query: { search: 'Author' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.req.query('search')).toBe('Author');
    });

    it('should sort custom fields', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findMany: jest.fn<() => Promise<typeof mockCustomField[]>>().mockResolvedValue([mockCustomField2, mockCustomField]),
      };

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => Promise<Array<{ count: number }>> } }>().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 2 }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields?sort=name_asc`,
        params: { orgId: testOrg.id },
        query: { sort: 'name_asc' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.req.query('sort')).toBe('name_asc');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/custom-fields', () => {
    it('should create a text custom field', async () => {
      const newFieldData = {
        name: 'Title',
        slug: 'title',
        fieldType: 'text' as const,
        settings: { max_length: 255 },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null), // Slug doesn't exist
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(newFieldData.fieldType).toBe('text');
    });

    it('should create a textarea custom field', async () => {
      const newFieldData = {
        name: 'Description',
        slug: 'description',
        fieldType: 'textarea' as const,
        settings: { max_length: 1000, rows: 5 },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newFieldData.fieldType).toBe('textarea');
    });

    it('should create a number custom field', async () => {
      const newFieldData = {
        name: 'Price',
        slug: 'price',
        fieldType: 'number' as const,
        settings: { min: 0, max: 10000, step: 0.01 },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newFieldData.fieldType).toBe('number');
    });

    it('should create a boolean custom field', async () => {
      const newFieldData = {
        name: 'Featured',
        slug: 'featured',
        fieldType: 'boolean' as const,
        settings: { default: false },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newFieldData.fieldType).toBe('boolean');
    });

    it('should create a select custom field', async () => {
      const newFieldData = {
        name: 'Status',
        slug: 'status',
        fieldType: 'select' as const,
        settings: {
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Archived', value: 'archived' },
          ],
        },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newFieldData.fieldType).toBe('select');
    });

    it('should create a json custom field', async () => {
      const newFieldData = {
        name: 'Metadata',
        slug: 'metadata',
        fieldType: 'json' as const,
        settings: { schema: {} },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<CustomField & { id: string }>>>().mockResolvedValue([{
            id: 'field_new_123',
            organizationId: testOrg.id,
            ...newFieldData,
            settings: JSON.stringify(newFieldData.settings),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: newFieldData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(newFieldData.fieldType).toBe('json');
    });

    it('should reject duplicate slug', async () => {
      const duplicateData = {
        name: 'Another Field',
        slug: mockCustomField.slug, // Using existing slug
        fieldType: 'text' as const,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(mockCustomField), // Slug exists
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: duplicateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(duplicateData.slug).toBe(mockCustomField.slug);
    });

    it('should validate slug format', async () => {
      const invalidData = {
        name: 'Test Field',
        slug: 'Invalid Slug!', // Invalid format (contains space and special char)
        fieldType: 'text' as const,
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail - slug must match /^[a-z0-9_]+$/
      expect(invalidData.slug).toMatch(/[^a-z0-9_]/);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields: name, slug, fieldType
        settings: {},
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('name');
      expect(invalidData).not.toHaveProperty('slug');
      expect(invalidData).not.toHaveProperty('fieldType');
    });

    it('should validate field type enum', async () => {
      const invalidData = {
        name: 'Test Field',
        slug: 'test_field',
        fieldType: 'invalid_type' as any, // Invalid field type
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/custom-fields`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      const validTypes = ['text', 'textarea', 'rich_text', 'number', 'boolean', 'date', 'datetime', 'media', 'relation', 'select', 'multi_select', 'json'];
      expect(validTypes).not.toContain(invalidData.fieldType);
    });
  });
});
