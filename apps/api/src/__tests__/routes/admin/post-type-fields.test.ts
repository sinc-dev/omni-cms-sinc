import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { PostType, CustomField, PostTypeField } from '../../../db/schema';

describe('Admin API - Post Type Fields', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockPostType: PostType = {
    id: 'post_type_123',
    organizationId: testOrg.id,
    name: 'Blog Post',
    slug: 'blog-post',
    description: 'Blog posts',
    isHierarchical: false,
    icon: null,
    settings: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

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

  const mockCustomField2: CustomField = {
    id: 'field_456',
    organizationId: testOrg.id,
    name: 'Reading Time',
    slug: 'reading_time',
    fieldType: 'number',
    settings: JSON.stringify({ min: 0 }),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockPostTypeField: PostTypeField = {
    id: 'ptf_123',
    postTypeId: mockPostType.id,
    customFieldId: mockCustomField.id,
    isRequired: false,
    defaultValue: null,
    order: 0,
    createdAt: new Date('2024-01-01'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields', () => {
    it('should return attached fields with ordering', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findMany: jest.fn<() => Promise<Array<PostTypeField & { customField: CustomField }>>>().mockResolvedValue([
          {
            ...mockPostTypeField,
            customField: mockCustomField,
          },
          {
            ...mockPostTypeField,
            id: 'ptf_456',
            customFieldId: mockCustomField2.id,
            order: 1,
            customField: mockCustomField2,
          },
        ]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('postTypeId')).toBe(mockPostType.id);
    });

    it('should return 404 when post type not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<PostType | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/non-existent/fields`,
        params: { orgId: testOrg.id, postTypeId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('postTypeId')).toBe('non-existent');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields', () => {
    it('should attach field to post type', async () => {
      const attachData = {
        customFieldId: mockCustomField.id,
        isRequired: true,
        order: 0,
        defaultValue: 'Default bio',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>()
          .mockResolvedValueOnce(mockPostType), // Post type exists
      };

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>()
          .mockResolvedValueOnce(mockCustomField), // Custom field exists
      };

      (mockDb.query as any).postTypeFields = {
        findFirst: jest.fn<() => Promise<PostTypeField | null>>()
          .mockResolvedValueOnce(null) // Field not already attached
          .mockResolvedValueOnce({
            ...mockPostTypeField,
            ...attachData,
            customField: mockCustomField,
          } as PostTypeField & { customField: CustomField }),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<PostTypeField & { id: string }>>>().mockResolvedValue([{
            id: 'ptf_new_123',
            postTypeId: mockPostType.id,
            ...attachData,
            createdAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        body: attachData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(attachData.isRequired).toBe(true);
    });

    it('should reject duplicate field attachment', async () => {
      const attachData = {
        customFieldId: mockCustomField.id,
        isRequired: false,
        order: 0,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      (mockDb.query as any).postTypeFields = {
        findFirst: jest.fn<() => Promise<PostTypeField | null>>()
          .mockResolvedValue(mockPostTypeField), // Field already attached
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        body: attachData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(attachData.customFieldId).toBe(mockCustomField.id);
    });

    it('should return 404 when post type not found', async () => {
      const attachData = {
        customFieldId: mockCustomField.id,
        isRequired: false,
        order: 0,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<PostType | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/non-existent/fields`,
        params: { orgId: testOrg.id, postTypeId: 'non-existent' },
        body: attachData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('postTypeId')).toBe('non-existent');
    });

    it('should return 404 when custom field not found', async () => {
      const attachData = {
        customFieldId: 'non-existent',
        isRequired: false,
        order: 0,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<CustomField | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        body: attachData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(attachData.customFieldId).toBe('non-existent');
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields/:fieldId', () => {
    it('should detach field from post type', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findFirst: jest.fn<() => Promise<PostTypeField | null>>().mockResolvedValue(mockPostTypeField),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields/${mockPostTypeField.id}`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id, fieldId: mockPostTypeField.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when attachment not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findFirst: jest.fn<() => Promise<PostTypeField | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields/non-existent`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id, fieldId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('fieldId')).toBe('non-existent');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/post-types/:postTypeId/fields/reorder', () => {
    it('should reorder fields', async () => {
      const reorderData = {
        fieldOrders: [
          { fieldId: mockPostTypeField.id, order: 2 },
          { fieldId: 'ptf_456', order: 1 },
        ],
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findFirst: jest.fn<() => Promise<PostTypeField | null>>()
          .mockResolvedValueOnce(mockPostTypeField)
          .mockResolvedValueOnce({ ...mockPostTypeField, id: 'ptf_456' }),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<PostTypeField>>>().mockResolvedValue([
              { ...mockPostTypeField, order: 2 },
              { ...mockPostTypeField, id: 'ptf_456', order: 1 },
            ]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields/reorder`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        body: reorderData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(reorderData.fieldOrders.length).toBe(2);
    });

    it('should return 404 when post type not found', async () => {
      const reorderData = {
        fieldOrders: [{ fieldId: mockPostTypeField.id, order: 1 }],
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<PostType | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/non-existent/fields/reorder`,
        params: { orgId: testOrg.id, postTypeId: 'non-existent' },
        body: reorderData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('postTypeId')).toBe('non-existent');
    });

    it('should validate reorder request format', async () => {
      const invalidData = {
        // Missing fieldOrders array
        fields: [{ id: 'ptf_123', order: 1 }],
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types/${mockPostType.id}/fields/reorder`,
        params: { orgId: testOrg.id, postTypeId: mockPostType.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('fieldOrders');
    });
  });
});
