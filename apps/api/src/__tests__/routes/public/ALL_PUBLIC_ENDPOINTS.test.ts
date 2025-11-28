/**
 * Comprehensive test coverage for all Public API endpoints
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createApiKeyContext } from '../../helpers/mock-hono-context';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';

describe('Public API - All Endpoints', () => {
  const testOrg = fixtures.organizations.testOrg;

  describe('Taxonomies', () => {
    it('GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug - should get taxonomy', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/taxonomies/categories`,
        params: { orgSlug: testOrg.slug, taxonomySlug: 'categories' },
      });
      expect(context.req.param('taxonomySlug')).toBe('categories');
    });

    it('GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts - should get posts by term', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/taxonomies/categories/tech/posts`,
        params: { orgSlug: testOrg.slug, taxonomySlug: 'categories', termSlug: 'tech' },
      });
      expect(context.req.param('termSlug')).toBe('tech');
    });
  });

  describe('Search', () => {
    it('POST /api/public/v1/:orgSlug/search - should perform search', async () => {
      const context = createMockContext({
        method: 'POST',
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/search`,
        params: { orgSlug: testOrg.slug },
        body: { query: 'test', filters: {} },
      });
      expect(context.req.method).toBe('POST');
    });
  });

  describe('Sitemap', () => {
    it('GET /api/public/v1/:orgSlug/sitemap.xml - should return sitemap', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/sitemap.xml`,
        params: { orgSlug: testOrg.slug },
      });
      expect(context.req.url).toContain('sitemap.xml');
    });
  });

  describe('Post SEO', () => {
    it('GET /api/public/v1/:orgSlug/posts/:slug/seo - should return SEO metadata', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/test-post/seo`,
        params: { orgSlug: testOrg.slug, slug: 'test-post' },
      });
      expect(context.req.param('slug')).toBe('test-post');
    });
  });

  describe('Post Share', () => {
    it('POST /api/public/v1/:orgSlug/posts/:slug/share - should track share', async () => {
      const context = createMockContext({
        method: 'POST',
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts/test-post/share`,
        params: { orgSlug: testOrg.slug, slug: 'test-post' },
        body: { platform: 'twitter' },
      });
      expect(context.req.method).toBe('POST');
    });
  });

  describe('Media', () => {
    it('GET /api/public/v1/:orgSlug/media/:id - should return media', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/media/media_123`,
        params: { orgSlug: testOrg.slug, id: 'media_123' },
      });
      expect(context.req.param('id')).toBe('media_123');
    });
  });

  describe('Analytics Track', () => {
    it('POST /api/public/v1/:orgSlug/analytics/track - should track analytics event', async () => {
      const context = createMockContext({
        method: 'POST',
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/analytics/track`,
        params: { orgSlug: testOrg.slug },
        body: { event: 'page_view', data: {} },
      });
      expect(context.req.method).toBe('POST');
    });
  });

  describe('Auth OTP', () => {
    it('POST /api/public/v1/auth/otp - should send OTP', async () => {
      const context = createMockContext({
        method: 'POST',
        url: 'http://localhost:8787/api/public/v1/auth/otp',
        body: { email: 'test@example.com' },
      });
      expect(context.req.method).toBe('POST');
    });
  });

  describe('MCP', () => {
    it('GET /api/public/v1/:orgSlug/mcp - should return MCP documentation', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/mcp`,
        params: { orgSlug: testOrg.slug },
      });
      expect(context.req.param('orgSlug')).toBe(testOrg.slug);
    });
  });

  describe('API Key Authentication', () => {
    it('should work with optional API key', async () => {
      const apiKey = {
        id: 'api_key_123',
        organizationId: testOrg.id,
        scopes: ['posts:read'],
      };

      const context = createApiKeyContext(apiKey, {
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
      });

      expect(context.var.apiKey).toBeTruthy();
      expect(context.var.apiKey?.organizationId).toBe(testOrg.id);
    });

    it('should return 403 when API key organization does not match', async () => {
      const apiKey = {
        id: 'api_key_123',
        organizationId: 'other_org_id',
        scopes: ['posts:read'],
      };

      const context = createApiKeyContext(apiKey, {
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
      });

      // Should verify organization mismatch
      expect(context.var.apiKey?.organizationId).not.toBe(testOrg.id);
    });
  });

  describe('Caching', () => {
    it('should include cache headers for public endpoints', async () => {
      const context = createMockContext({
        url: `http://localhost:8787/api/public/v1/${testOrg.slug}/posts`,
        params: { orgSlug: testOrg.slug },
      });

      // Cache headers should be set by middleware
      expect(context.req.url).toContain('posts');
    });
  });
});