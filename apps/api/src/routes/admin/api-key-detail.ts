import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { apiKeys } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const updateApiKeySchema = z.object({
  name: z.string().min(1).optional(),
  rateLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/v1/organizations/:orgId/api-keys/:keyId
app.get(
  '/:orgId/api-keys/:keyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const keyId = c.req.param('keyId');

    const apiKey = await db.query.apiKeys.findFirst({
      where: (ak, { eq, and: andFn }) => andFn(
        eq(ak.id, keyId),
        eq(ak.organizationId, organizationId!)
      ),
    });

    if (!apiKey) {
      return c.json(Errors.notFound('API key'), 404);
    }

    // Return safe version without hashed key
    return c.json(successResponse({
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes ? JSON.parse(apiKey.scopes) : [],
      rateLimit: apiKey.rateLimit,
      revokedAt: apiKey.revokedAt || null,
      rotatedFromId: apiKey.rotatedFromId || null,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
    }));
  }
);

// PATCH /api/admin/v1/organizations/:orgId/api-keys/:keyId
app.patch(
  '/:orgId/api-keys/:keyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const keyId = c.req.param('keyId');

    let updateData;
    try {
      const body = await c.req.json();
      updateData = updateApiKeySchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    // Parse expiresAt if provided
    const updatePayload: {
      name?: string;
      rateLimit?: number;
      expiresAt?: Date | null;
    } = {};

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name;
    }
    if (updateData.rateLimit !== undefined) {
      updatePayload.rateLimit = updateData.rateLimit;
    }
    if (updateData.expiresAt !== undefined) {
      updatePayload.expiresAt = updateData.expiresAt ? new Date(updateData.expiresAt) : null;
    }

    const updated = await db
      .update(apiKeys)
      .set(updatePayload)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return c.json(Errors.notFound('API key'), 404);
    }

    const updatedResult = updatedArray[0];
    
    // Return safe version
    return c.json(successResponse({
      id: updatedResult.id,
      organizationId: updatedResult.organizationId,
      name: updatedResult.name,
      keyPrefix: updatedResult.keyPrefix,
      scopes: updatedResult.scopes ? JSON.parse(updatedResult.scopes) : [],
      rateLimit: updatedResult.rateLimit,
      revokedAt: updatedResult.revokedAt || null,
      rotatedFromId: updatedResult.rotatedFromId || null,
      createdAt: updatedResult.createdAt,
      lastUsedAt: updatedResult.lastUsedAt,
      expiresAt: updatedResult.expiresAt,
    }));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/api-keys/:keyId
app.delete(
  '/:orgId/api-keys/:keyId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const keyId = c.req.param('keyId');

    const deleted = await db
      .delete(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, organizationId!)
        )
      )
      .returning();

    const deletedArray = Array.isArray(deleted) ? deleted : [];
    if (deletedArray.length === 0) {
      return c.json(Errors.notFound('API key'), 404);
    }

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

