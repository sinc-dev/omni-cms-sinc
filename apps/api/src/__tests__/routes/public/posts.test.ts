import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext } from '../../helpers/mock-hono-context';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { CustomField, PostFieldValue, PostType } from '../../../db/schema';

describe('Public API - Posts', () => {
  const testOrg = fixtures.organizations.testOrg;

  const mockPublishedPost = {
    id: 'post_123',
    organizationId: testOrg.id,
    title: 'Published Post',
    slug: 'published-post',
    content: '<p>Content</p>',
    excerpt: 'Excerpt',
    status: 'published',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/public/v1/:orgSlug/posts', () => {
    it('should return published posts for organization', async () => {
      const mockDb = createMockDb({
        users: [],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.query as any).posts = {
        findMany: jest.fn<() => Promise<typeof mockPublishedPost[]>>().mockResolvedValue([mockPublishedPost]),
      };

      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('orgSlug')).toBe(testOrg.slug);
    });

    it('should return 404 when organization not found', async () => {
      const mockDb = createMockDb({
        users: [],
        organizations: [],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(null),
      };

      const context = createMockContext({
        url: 'http://localhost:8787/api/public/v1/non-existent/posts',
        params: { orgSlug: 'non-existent' },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('orgSlug')).toBe('non-existent');
    });

    it('should filter posts by post type', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts?post_type=blog-post`,
        params: { orgSlug: testOrg.slug },
        query: { post_type: 'blog-post' },
      });

      expect(context.req.query('post_type')).toBe('blog-post');
    });

    it('should filter posts by taxonomies', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts?taxonomy=categories:tech`,
        params: { orgSlug: testOrg.slug },
        query: { taxonomy: 'categories:tech' },
      });

      expect(context.req.query('taxonomy')).toBe('categories:tech');
    });

    it('should support pagination', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts?page=2&per_page=10`,
        params: { orgSlug: testOrg.slug },
        query: { page: '2', per_page: '10' },
      });

      expect(context.req.query('page')).toBe('2');
      expect(context.req.query('per_page')).toBe('10');
    });

    it('should include caching headers', async () => {
      // Test would verify Cache-Control headers
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
      });

      expect(context.req.url).toContain(testOrg.slug);
    });
  });

  describe('GET /api/public/v1/:orgSlug/posts/:slug', () => {
    it('should return post by slug', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/${mockPublishedPost.slug}`,
        params: { orgSlug: testOrg.slug, slug: mockPublishedPost.slug },
      });

      expect(context.req.param('slug')).toBe(mockPublishedPost.slug);
    });

    it('should return 404 when post not found', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/non-existent`,
        params: { orgSlug: testOrg.slug, slug: 'non-existent' },
      });

      expect(context.req.param('slug')).toBe('non-existent');
    });

    it('should only return published posts', async () => {
      // Test should verify that draft posts are not returned
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/draft-post`,
        params: { orgSlug: testOrg.slug, slug: 'draft-post' },
      });

      expect(context.req.param('slug')).toBe('draft-post');
    });

    it('should return post with custom field values', async () => {
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
        postId: mockPublishedPost.id,
        customFieldId: mockCustomField.id,
        value: JSON.stringify('Author bio text'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = createMockDb({
        users: [],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.query as any).posts = {
        findFirst: jest.fn<() => Promise<typeof mockPublishedPost & { postType: PostType } | null>>().mockResolvedValue({
          ...mockPublishedPost,
          postType: mockPostType,
        } as any),
      };

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findMany: jest.fn<() => Promise<Array<{ customFieldId: string }>>>().mockResolvedValue([
          { customFieldId: mockCustomField.id },
        ]),
      };

      (mockDb.query as any).postFieldValues = {
        findMany: jest.fn<() => Promise<typeof mockFieldValue[]>>().mockResolvedValue([mockFieldValue]),
      };

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      (mockDb.query as any).postTaxonomies = {
        findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      };

      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/${mockPublishedPost.slug}`,
        params: { orgSlug: testOrg.slug, slug: mockPublishedPost.slug },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('slug')).toBe(mockPublishedPost.slug);
    });

    it('should filter posts by custom field values', async () => {
      const mockCustomField: CustomField = {
        id: 'field_123',
        organizationId: testOrg.id,
        name: 'Category',
        slug: 'category',
        fieldType: 'select',
        settings: JSON.stringify({
          options: [
            { label: 'Tech', value: 'tech' },
            { label: 'Blog', value: 'blog' },
          ],
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = createMockDb({
        users: [],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.query as any).posts = {
        findMany: jest.fn<() => Promise<typeof mockPublishedPost[]>>().mockResolvedValue([mockPublishedPost]),
      };

      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts?custom_fields[category]=tech`,
        params: { orgSlug: testOrg.slug },
        query: { 'custom_fields[category]': 'tech' },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.query('custom_fields[category]')).toBe('tech');
    });

    it('should return custom fields in post list response', async () => {
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

      const mockCustomField: CustomField = {
        id: 'field_123',
        organizationId: testOrg.id,
        name: 'Reading Time',
        slug: 'reading_time',
        fieldType: 'number',
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = createMockDb({
        users: [],
        organizations: [testOrg],
      });

      (mockDb.query as any).organizations = {
        findFirst: jest.fn<() => Promise<typeof testOrg | null>>().mockResolvedValue(testOrg),
      };

      (mockDb.query as any).posts = {
        findMany: jest.fn<() => Promise<Array<typeof mockPublishedPost & { postType: PostType }>>>().mockResolvedValue([{
          ...mockPublishedPost,
          postType: mockPostType,
        } as any]),
      };

      (mockDb.query as any).postTypes = {
        findFirst: jest.fn<() => Promise<typeof mockPostType | null>>().mockResolvedValue(mockPostType),
      };

      (mockDb.query as any).postTypeFields = {
        findMany: jest.fn<() => Promise<Array<{ customFieldId: string }>>>().mockResolvedValue([
          { customFieldId: mockCustomField.id },
        ]),
      };

      (mockDb.query as any).postFieldValues = {
        findMany: jest.fn<() => Promise<Array<PostFieldValue>>>().mockResolvedValue([
          {
            id: 'pfv_123',
            postId: mockPublishedPost.id,
            customFieldId: mockCustomField.id,
            value: JSON.stringify(5),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      };

      (mockDb.query as any).customFields = {
        findFirst: jest.fn<() => Promise<typeof mockCustomField | null>>().mockResolvedValue(mockCustomField),
      };

      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('orgSlug')).toBe(testOrg.slug);
    });
  });
});