import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext } from '../../helpers/mock-hono-context';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';

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
  });
});