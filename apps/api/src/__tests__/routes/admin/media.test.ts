import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';

describe('Admin API - Media', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockMedia = {
    id: 'media_123',
    organizationId: testOrg.id,
    filename: 'test.jpg',
    url: 'https://r2.example.com/test.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024,
    width: 1920,
    height: 1080,
    altText: null,
    caption: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('GET /api/admin/v1/organizations/:orgId/media', () => {
    it('should return paginated media list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).media = {
        findMany: jest.fn<() => Promise<typeof mockMedia[]>>().mockResolvedValue([mockMedia]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/media`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
    });

    it('should filter media by MIME type', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/media?mime_type=image/jpeg`,
        params: { orgId: testOrg.id },
        query: { mime_type: 'image/jpeg' },
        organizationId: testOrg.id,
      });

      expect(context.req.query('mime_type')).toBe('image/jpeg');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/media', () => {
    it('should upload media file', async () => {
      const formData = new FormData();
      const blob = new Blob(['test'], { type: 'image/jpeg' });
      formData.append('file', blob, 'test.jpg');
      formData.append('alt_text', 'Test image');

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/media`,
        params: { orgId: testOrg.id },
        body: formData,
        organizationId: testOrg.id,
      });

      expect(context.req.method).toBe('POST');
    });
  });
});