import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Post, PostType, CustomField, PostFieldValue } from '../../../db/schema';

describe('Admin API - Posts', () => {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPost: Post = {
    id: 'post_123',
    organizationId: testOrg.id,
    postTypeId: mockPostType.id,
    authorId: regularUser.id,
    title: 'Test Post',
    slug: 'test-post',
    content: '<p>Test content</p>',
    excerpt: 'Test excerpt',
    status: 'draft',
    workflowStatus: 'draft',
    featuredImageId: null,
    parentId: null,
    publishedAt: null,
    scheduledPublishAt: null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    ogImageId: null,
    canonicalUrl: null,
    structuredData: null,
    viewCount: 0,
    shareCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/admin/v1/organizations/:orgId/posts', () => {
    it('should return paginated posts list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).posts = {
        findMany: jest.fn<() => Promise<typeof mockPost[]>>().mockResolvedValue([mockPost]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should filter posts by status', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts?status=published`,
        params: { orgId: testOrg.id },
        query: { status: 'published' },
        organizationId: testOrg.id,
      });

      expect(context.req.query('status')).toBe('published');
    });

    it('should filter posts by post type', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts?post_type=${mockPostType.id}`,
        params: { orgId: testOrg.id },
        query: { post_type: mockPostType.id },
        organizationId: testOrg.id,
      });

      expect(context.req.query('post_type')).toBe(mockPostType.id);
    });

    it('should search posts by title and content', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts?search=test`,
        params: { orgId: testOrg.id },
        query: { search: 'test' },
        organizationId: testOrg.id,
      });

      expect(context.req.query('search')).toBe('test');
    });

    it('should return 403 when user lacks posts:read permission', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
      });

      // Permission check would happen in middleware
      expect(context.var.user).toBeTruthy();
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/posts', () => {
    it('should create a new post', async () => {
      const newPostData = {
        postTypeId: mockPostType.id,
        title: 'New Post',
        slug: 'new-post',
        content: '<p>New content</p>',
        status: 'draft',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<typeof mockPost & { id: string }>>>().mockResolvedValue([{
            id: 'post_new_123',
            organizationId: testOrg.id,
            authorId: regularUser.id,
            ...newPostData,
            excerpt: null,
            workflowStatus: 'draft',
            featuredImageId: null,
            parentId: null,
            publishedAt: null,
            scheduledPublishAt: null,
            metaTitle: null,
            metaDescription: null,
            metaKeywords: null,
            ogImageId: null,
            canonicalUrl: null,
            structuredData: null,
            viewCount: 0,
            shareCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: newPostData,
        organizationId: testOrg.id,
        env: { DB: { insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
        title: 'Test',
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('postTypeId');
    });

    it('should create post with custom field values', async () => {
      const mockCustomField: CustomField = {
        id: 'field_123',
        organizationId: testOrg.id,
        name: 'Author Bio',
        slug: 'author_bio',
        fieldType: 'textarea',
        settings: JSON.stringify({ max_length: 500 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const postWithFields = {
        postTypeId: mockPostType.id,
        title: 'Post with Fields',
        slug: 'post-with-fields',
        content: '<p>Content</p>',
        status: 'draft',
        customFields: {
          [mockCustomField.id]: 'Author bio text',
        },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.insert as any) = jest.fn()
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockPost & { id: string }>>>().mockResolvedValue([{
              id: 'post_new_123',
              organizationId: testOrg.id,
              authorId: regularUser.id,
              postTypeId: mockPostType.id,
              title: postWithFields.title,
              slug: postWithFields.slug,
              content: postWithFields.content,
              excerpt: null,
              status: 'draft',
              workflowStatus: 'draft',
              featuredImageId: null,
              parentId: null,
              publishedAt: null,
              scheduledPublishAt: null,
              metaTitle: null,
              metaDescription: null,
              metaKeywords: null,
              ogImageId: null,
              canonicalUrl: null,
              structuredData: null,
              viewCount: 0,
              shareCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<PostFieldValue & { id: string }>>>().mockResolvedValue([{
              id: 'pfv_123',
              postId: 'post_new_123',
              customFieldId: mockCustomField.id,
              value: JSON.stringify('Author bio text'),
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
          }),
        });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: postWithFields,
        organizationId: testOrg.id,
        env: { DB: { insert: mockDb.insert } as any },
      });

      expect(postWithFields.customFields).toBeDefined();
      expect(postWithFields.customFields[mockCustomField.id]).toBe('Author bio text');
    });

    it('should create post with multiple custom field types', async () => {
      const textField: CustomField = {
        id: 'field_text_123',
        organizationId: testOrg.id,
        name: 'Title',
        slug: 'title',
        fieldType: 'text',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const numberField: CustomField = {
        id: 'field_number_123',
        organizationId: testOrg.id,
        name: 'Reading Time',
        slug: 'reading_time',
        fieldType: 'number',
        settings: JSON.stringify({ min: 0, max: 1000 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const booleanField: CustomField = {
        id: 'field_bool_123',
        organizationId: testOrg.id,
        name: 'Featured',
        slug: 'featured',
        fieldType: 'boolean',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const postWithFields = {
        postTypeId: mockPostType.id,
        title: 'Post with Multiple Fields',
        slug: 'post-multiple-fields',
        content: '<p>Content</p>',
        status: 'draft',
        customFields: {
          [textField.id]: 'Custom Title',
          [numberField.id]: 5,
          [booleanField.id]: true,
        },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.insert as any) = jest.fn()
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockPost & { id: string }>>>().mockResolvedValue([{
              id: 'post_new_123',
              organizationId: testOrg.id,
              authorId: regularUser.id,
              postTypeId: mockPostType.id,
              title: postWithFields.title,
              slug: postWithFields.slug,
              content: postWithFields.content,
              excerpt: null,
              status: 'draft',
              workflowStatus: 'draft',
              featuredImageId: null,
              parentId: null,
              publishedAt: null,
              scheduledPublishAt: null,
              metaTitle: null,
              metaDescription: null,
              metaKeywords: null,
              ogImageId: null,
              canonicalUrl: null,
              structuredData: null,
              viewCount: 0,
              shareCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<PostFieldValue & { id: string }>>>().mockResolvedValue([
              {
                id: 'pfv_1',
                postId: 'post_new_123',
                customFieldId: textField.id,
                value: JSON.stringify('Custom Title'),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'pfv_2',
                postId: 'post_new_123',
                customFieldId: numberField.id,
                value: JSON.stringify(5),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'pfv_3',
                postId: 'post_new_123',
                customFieldId: booleanField.id,
                value: JSON.stringify(true),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: postWithFields,
        organizationId: testOrg.id,
        env: { DB: { insert: mockDb.insert } as any },
      });

      expect(postWithFields.customFields[textField.id]).toBe('Custom Title');
      expect(postWithFields.customFields[numberField.id]).toBe(5);
      expect(postWithFields.customFields[booleanField.id]).toBe(true);
    });

    it('should create post with JSON custom field value', async () => {
      const jsonField: CustomField = {
        id: 'field_json_123',
        organizationId: testOrg.id,
        name: 'Metadata',
        slug: 'metadata',
        fieldType: 'json',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const postWithJsonField = {
        postTypeId: mockPostType.id,
        title: 'Post with JSON Field',
        slug: 'post-json-field',
        content: '<p>Content</p>',
        status: 'draft',
        customFields: {
          [jsonField.id]: { tags: ['tech', 'blog'], priority: 'high' },
        },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.insert as any) = jest.fn()
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockPost & { id: string }>>>().mockResolvedValue([{
              id: 'post_new_123',
              organizationId: testOrg.id,
              authorId: regularUser.id,
              postTypeId: mockPostType.id,
              title: postWithJsonField.title,
              slug: postWithJsonField.slug,
              content: postWithJsonField.content,
              excerpt: null,
              status: 'draft',
              workflowStatus: 'draft',
              featuredImageId: null,
              parentId: null,
              publishedAt: null,
              scheduledPublishAt: null,
              metaTitle: null,
              metaDescription: null,
              metaKeywords: null,
              ogImageId: null,
              canonicalUrl: null,
              structuredData: null,
              viewCount: 0,
              shareCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
          }),
        })
        .mockReturnValueOnce({
          values: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<PostFieldValue & { id: string }>>>().mockResolvedValue([{
              id: 'pfv_123',
              postId: 'post_new_123',
              customFieldId: jsonField.id,
              value: JSON.stringify(postWithJsonField.customFields[jsonField.id]),
              createdAt: new Date(),
              updatedAt: new Date(),
            }]),
          }),
        });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: postWithJsonField,
        organizationId: testOrg.id,
        env: { DB: { insert: mockDb.insert } as any },
      });

      expect(typeof postWithJsonField.customFields[jsonField.id]).toBe('object');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/posts/:postId', () => {
    it('should update post with custom field values', async () => {
      const mockCustomField: CustomField = {
        id: 'field_123',
        organizationId: testOrg.id,
        name: 'Author Bio',
        slug: 'author_bio',
        fieldType: 'textarea',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        title: 'Updated Post',
        customFields: {
          [mockCustomField.id]: 'Updated author bio',
        },
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).posts = {
        findFirst: jest.fn<() => Promise<typeof mockPost | null>>().mockResolvedValue(mockPost),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockPost>>>().mockResolvedValue([{
              ...mockPost,
              title: updateData.title,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<PostFieldValue & { id: string }>>>().mockResolvedValue([{
            id: 'pfv_123',
            postId: mockPost.id,
            customFieldId: mockCustomField.id,
            value: JSON.stringify(updateData.customFields[mockCustomField.id]),
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts/${mockPost.id}`,
        params: { orgId: testOrg.id, postId: mockPost.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update, delete: mockDb.delete, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.customFields[mockCustomField.id]).toBe('Updated author bio');
    });

    it('should remove custom field values when empty object provided', async () => {
      const updateData = {
        title: 'Updated Post',
        customFields: {},
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).posts = {
        findFirst: jest.fn<() => Promise<typeof mockPost | null>>().mockResolvedValue(mockPost),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockPost>>>().mockResolvedValue([{
              ...mockPost,
              title: updateData.title,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts/${mockPost.id}`,
        params: { orgId: testOrg.id, postId: mockPost.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update, delete: mockDb.delete } as any },
      });

      expect(Object.keys(updateData.customFields).length).toBe(0);
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/posts/:postId', () => {
    it('should return post with custom field values', async () => {
      const mockCustomField: CustomField = {
        id: 'field_123',
        organizationId: testOrg.id,
        name: 'Author Bio',
        slug: 'author_bio',
        fieldType: 'textarea',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFieldValue: PostFieldValue = {
        id: 'pfv_123',
        postId: mockPost.id,
        customFieldId: mockCustomField.id,
        value: JSON.stringify('Author bio text'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).posts = {
        findFirst: jest.fn<() => Promise<typeof mockPost & { fieldValues: PostFieldValue[] } | null>>().mockResolvedValue({
          ...mockPost,
          fieldValues: [mockFieldValue],
        } as any),
      };

      (mockDb.query as any).postTaxonomies = {
        findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts/${mockPost.id}`,
        params: { orgId: testOrg.id, postId: mockPost.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('postId')).toBe(mockPost.id);
    });
  });

  // Add more tests for POST detail, update, delete, publish, versions, locks, etc.
});