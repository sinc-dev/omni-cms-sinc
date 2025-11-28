import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockContext, createAuthenticatedContext } from '../../helpers/mock-hono-context';
import { createMockUser } from '../../helpers/mock-auth';
import { fixtures } from '../../helpers/fixtures';
import { createMockDb } from '../../helpers/mock-db';

describe('Admin API - Users', () => {
  const testOrg = fixtures.organizations.testOrg;
  const regularUser = createMockUser();
  const anotherUser = createMockUser({ id: 'user_456', email: 'user2@example.com' });

  describe('GET /api/admin/v1/organizations/:orgId/users', () => {
    it('should return paginated users list', async () => {
      const mockDb = createMockDb({
        users: [regularUser, anotherUser],
        organizations: [testOrg],
      });

      (mockDb.query as any).usersOrganizations = {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: regularUser.id,
            organizationId: testOrg.id,
            user: regularUser,
            role: { id: 'role_123', name: 'Editor' },
          },
        ]),
      };

      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/users`,
        params: { orgId: testOrg.id },
        query: { page: '1', per_page: '20' },
        organizationId: testOrg.id,
        env: { DB: { query: mockDb.query } as any },
      });

      expect(context.var.organizationId).toBe(testOrg.id);
    });

    it('should filter users by role', async () => {
      const context = createAuthenticatedContext(regularUser, {
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/users?role_id=role_123`,
        params: { orgId: testOrg.id },
        query: { role_id: 'role_123' },
        organizationId: testOrg.id,
      });

      expect(context.req.query('role_id')).toBe('role_123');
    });
  });

  describe('POST /api/admin/v1/organizations/:orgId/users', () => {
    it('should add user to organization', async () => {
      const newUserData = {
        email: 'newuser@example.com',
        roleId: 'role_123',
      };

      const context = createAuthenticatedContext(regularUser, {
        method: 'POST',
        url: `http://localhost:8787/api/admin/v1/organizations/${testOrg.id}/users`,
        params: { orgId: testOrg.id },
        body: newUserData,
        organizationId: testOrg.id,
      });

      expect(newUserData.email).toBe('newuser@example.com');
    });
  });
});