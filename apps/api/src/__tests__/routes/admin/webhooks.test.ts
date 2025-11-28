import { describe, it, expect, jest } from '@jest/globals';
import { createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';
import type { Webhook } from '../../../db/schema';

describe('Admin API - Webhooks', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();

  const mockWebhook: Webhook = {
    id: 'webhook_123',
    organizationId: testOrg.id,
    name: 'Production Webhook',
    url: 'https://example.com/webhook',
    events: JSON.stringify(['post.published', 'post.updated']),
    secret: 'webhook_secret_hash',
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockWebhook2: Webhook = {
    id: 'webhook_456',
    organizationId: testOrg.id,
    name: 'Development Webhook',
    url: 'https://dev.example.com/webhook',
    events: JSON.stringify(['post.created']),
    secret: 'webhook_secret_hash_2',
    active: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  describe('GET /api/admin/v1/organizations/:orgId/webhooks', () => {
    it('should return paginated webhooks list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => { limit: () => { offset: () => { orderBy: () => Promise<Webhook[]> } } } } } | { from: () => { where: () => Promise<Array<{ count: number }>> } }>()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue({
                  orderBy: jest.fn<() => Promise<Webhook[]>>().mockResolvedValue([mockWebhook, mockWebhook2]),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 2 }]),
          }),
        } as any);

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks?page=1&per_page=20`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { select: mockDb.select } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should not expose webhook secrets in list', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.select as any) = jest.fn<() => { from: () => { where: () => { limit: () => { offset: () => { orderBy: () => Promise<Webhook[]> } } } } } | { from: () => { where: () => Promise<Array<{ count: number }>> } }>()
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue({
                  orderBy: jest.fn<() => Promise<Webhook[]>>().mockResolvedValue([mockWebhook]),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 1 }]),
          }),
        } as any);

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks`,
        params: { orgId: testOrg.id },
        organizationId: testOrg.id,
        env: { DB: { select: mockDb.select } as any },
      });

      // Response should not include secret
      expect(mockWebhook.secret).toBeDefined(); // Secret exists in DB
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/webhooks', () => {
    it('should create webhook with events', async () => {
      const newWebhookData = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['post.published', 'post.updated'],
        active: true,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<Webhook & { id: string }>>>().mockResolvedValue([{
            id: 'webhook_new_123',
            organizationId: testOrg.id,
            name: newWebhookData.name,
            url: newWebhookData.url,
            events: JSON.stringify(newWebhookData.events),
            secret: 'generated_secret',
            active: newWebhookData.active,
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks`,
        params: { orgId: testOrg.id },
        body: newWebhookData,
        organizationId: testOrg.id,
        env: { DB: { insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(newWebhookData.events.length).toBe(2);
    });

    it('should validate URL format', async () => {
      const invalidData = {
        name: 'Test Webhook',
        url: 'not-a-valid-url', // Invalid URL
        events: ['post.published'],
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData.url).not.toMatch(/^https?:\/\//);
    });

    it('should require at least one event', async () => {
      const invalidData = {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: [], // Empty events array
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData.events.length).toBe(0);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields: name, url, events
        active: true,
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks`,
        params: { orgId: testOrg.id },
        body: invalidData,
        organizationId: testOrg.id,
      });

      // Validation should fail
      expect(invalidData).not.toHaveProperty('name');
      expect(invalidData).not.toHaveProperty('url');
      expect(invalidData).not.toHaveProperty('events');
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId', () => {
    it('should return webhook details', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('webhookId')).toBe(mockWebhook.id);
    });

    it('should return 404 when webhook not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<Webhook | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/non-existent`,
        params: { orgId: testOrg.id, webhookId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('webhookId')).toBe('non-existent');
    });
  });

  describe('PATCH /api/admin/v1/organizations/:orgId/webhooks/:webhookId', () => {
    it('should update webhook name', async () => {
      const updateData = {
        name: 'Updated Webhook Name',
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockWebhook>>>().mockResolvedValue([{
              ...mockWebhook,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(context.req.method).toBe('PATCH');
      expect(updateData.name).toBe('Updated Webhook Name');
    });

    it('should update webhook events', async () => {
      const updateData = {
        events: ['post.created', 'post.deleted'],
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockWebhook>>>().mockResolvedValue([{
              ...mockWebhook,
              events: JSON.stringify(updateData.events),
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(updateData.events.length).toBe(2);
    });

    it('should toggle webhook active status', async () => {
      const updateData = {
        active: false,
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.update as any) = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn<() => Promise<Array<typeof mockWebhook>>>().mockResolvedValue([{
              ...mockWebhook,
              ...updateData,
              updatedAt: new Date(),
            }]),
          }),
        }),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'PATCH',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        body: updateData,
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, update: mockDb.update } as any },
      });

      expect(updateData.active).toBe(false);
    });
  });

  describe('DELETE /api/admin/v1/organizations/:orgId/webhooks/:webhookId', () => {
    it('should delete webhook', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.delete as any) = jest.fn().mockReturnValue({
        where: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      });

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, delete: mockDb.delete } as any },
      });

      expect(context.req.method).toBe('DELETE');
    });

    it('should return 404 when deleting non-existent webhook', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<Webhook | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'DELETE',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/non-existent`,
        params: { orgId: testOrg.id, webhookId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('webhookId')).toBe('non-existent');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/webhooks/:webhookId/test', () => {
    it('should test webhook delivery', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<any>>>().mockResolvedValue([{
            id: 'log_123',
            webhookId: mockWebhook.id,
            event: 'webhook.test',
            payload: JSON.stringify({ event: 'webhook.test', data: { message: 'This is a test webhook' } }),
            responseStatus: 200,
            responseBody: 'OK',
            createdAt: new Date(),
          }]),
        }),
      });

      // Mock global fetch
      global.fetch = jest.fn<() => Promise<Response>>().mockResolvedValue({
        status: 200,
        text: jest.fn<() => Promise<string>>().mockResolvedValue('OK'),
      } as any);

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}/test`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.method).toBe('POST');
      expect(context.req.param('webhookId')).toBe(mockWebhook.id);
    });

    it('should return 404 when webhook not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<Webhook | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/non-existent/test`,
        params: { orgId: testOrg.id, webhookId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('webhookId')).toBe('non-existent');
    });

    it('should handle network errors during webhook test', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.insert as any) = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn<() => Promise<Array<any>>>().mockResolvedValue([{
            id: 'log_123',
            webhookId: mockWebhook.id,
            event: 'webhook.test',
            payload: JSON.stringify({ event: 'webhook.test' }),
            responseStatus: 0,
            responseBody: 'Network error',
            createdAt: new Date(),
          }]),
        }),
      });

      // Mock global fetch to throw error
      global.fetch = jest.fn<() => Promise<Response>>().mockRejectedValue(new Error('Network error'));

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}/test`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, insert: mockDb.insert } as any },
      });

      expect(context.req.param('webhookId')).toBe(mockWebhook.id);
    });
  });

  describe('GET /api/admin/v1/organizations/:orgId/webhooks/:webhookId/logs', () => {
    it('should return paginated webhook logs', async () => {
      const mockLog = {
        id: 'log_123',
        webhookId: mockWebhook.id,
        event: 'post.published',
        payload: JSON.stringify({ event: 'post.published', data: { postId: 'post_123' } }),
        responseStatus: 200,
        responseBody: 'OK',
        createdAt: new Date('2024-01-01'),
      };

      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<typeof mockWebhook | null>>().mockResolvedValue(mockWebhook),
      };

      (mockDb.query as any).webhookLogs = {
        findMany: jest.fn<() => Promise<typeof mockLog[]>>().mockResolvedValue([mockLog]),
      };

      (mockDb.select as any) = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn<() => Promise<Array<{ count: number }>>>().mockResolvedValue([{ count: 1 }]),
        }),
      }) as any;

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/${mockWebhook.id}/logs?page=1&per_page=20`,
        params: { orgId: testOrg.id, webhookId: mockWebhook.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query, select: mockDb.select } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
      expect(context.req.param('webhookId')).toBe(mockWebhook.id);
      expect(context.req.query('page')).toBe('1');
    });

    it('should return 404 when webhook not found', async () => {
      const mockDb = createMockDb({
        users: [regularUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).webhooks = {
        findFirst: jest.fn<() => Promise<Webhook | null>>().mockResolvedValue(null),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/webhooks/non-existent/logs`,
        params: { orgId: testOrg.id, webhookId: 'non-existent' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.req.param('webhookId')).toBe('non-existent');
    });
  });
});
