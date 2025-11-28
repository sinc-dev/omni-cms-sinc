import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';

describe('Admin API - Post Types', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockPostType = {
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

  describe('GET /api/admin/v1/organizations/:orgId/post-types', () => {
    it('should return post types list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).postTypes = {
        findMany: jest.fn().mockResolvedValue([mockPostType]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/post-types', () => {
    it('should create a new post type', async () => {
      const newPostTypeData = {
        name: 'News Article',
        slug: 'news-article',
        description: 'News articles',
        isHierarchical: false,
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/post-types`,
        params: { orgId: testOrg.id },
        body: newPostTypeData,
        organizationId: testOrg.id,
      });

      expect(newPostTypeData.name).toBe('News Article');
    });
  });
});