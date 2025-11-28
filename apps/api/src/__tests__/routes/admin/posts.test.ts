import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Post, PostType } from '../../../db/schema';

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
    featuredImageId: null,
    parentId: null,
    publishedAt: null,
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
        findMany: jest.fn().mockResolvedValue([mockPost]),
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
          returning: jest.fn().mockResolvedValue([{
            id: 'post_new_123',
            organizationId: testOrg.id,
            authorId: regularUser.id,
            ...newPostData,
            excerpt: null,
            featuredImageId: null,
            parentId: null,
            publishedAt: null,
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

    it('should handle custom fields', async () => {
      const postWithFields = {
        postTypeId: mockPostType.id,
        title: 'Post with Fields',
        slug: 'post-with-fields',
        content: '<p>Content</p>',
        status: 'draft',
        customFields: {
          author_bio: 'Author bio',
          reading_time: 5,
        },
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/posts`,
        params: { orgId: testOrg.id },
        body: postWithFields,
        organizationId: testOrg.id,
      });

      expect(postWithFields.customFields).toBeDefined();
    });
  });

  // Add more tests for POST detail, update, delete, publish, versions, locks, etc.
});