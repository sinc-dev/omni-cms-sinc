import { eq, and } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { apiKeys } from '@/db/schema';
import { z } from 'zod';

export const runtime = 'edge';

const updateApiKeySchema = z.object({
  name: z.string().min(1).optional(),
  rateLimit: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/v1/organizations/:orgId/api-keys/:keyId
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const keyId = params?.keyId;
    if (!keyId) return Errors.badRequest('API key ID required');

    const apiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.organizationId, organizationId!)
      ),
    });

    if (!apiKey) {
      return Errors.notFound('API key');
    }

    // Return safe version without hashed key
    return successResponse({
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      rateLimit: apiKey.rateLimit,
      createdAt: apiKey.createdAt,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
    });
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

// PATCH /api/admin/v1/organizations/:orgId/api-keys/:keyId
export const PATCH = withAuth(
  async (request, { db, organizationId }, params) => {
    const keyId = params?.keyId;
    if (!keyId) return Errors.badRequest('API key ID required');

    const validation = await validateRequest(request, updateApiKeySchema);
    if (!validation.success) return validation.response;

    // Parse expiresAt if provided
    let expiresAt: Date | null | undefined = undefined;
    if (validation.data.expiresAt !== undefined) {
      expiresAt = validation.data.expiresAt ? new Date(validation.data.expiresAt) : null;
    }

    const updateData: {
      name?: string;
      rateLimit?: number;
      expiresAt?: Date | null;
    } = {};

    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.rateLimit !== undefined) {
      updateData.rateLimit = validation.data.rateLimit;
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt;
    }

    const updated = await db
      .update(apiKeys)
      .set(updateData)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, organizationId!)
        )
      )
      .returning();

    const updatedArray = Array.isArray(updated) ? updated : [];
    if (updatedArray.length === 0) {
      return Errors.notFound('API key');
    }

    const updatedResult = updatedArray[0];
    
    // Return safe version
    return successResponse({
      id: updatedResult.id,
      organizationId: updatedResult.organizationId,
      name: updatedResult.name,
      keyPrefix: updatedResult.keyPrefix,
      rateLimit: updatedResult.rateLimit,
      createdAt: updatedResult.createdAt,
      lastUsedAt: updatedResult.lastUsedAt,
      expiresAt: updatedResult.expiresAt,
    });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

// DELETE /api/admin/v1/organizations/:orgId/api-keys/:keyId
export const DELETE = withAuth(
  async (request, { db, organizationId }, params) => {
    const keyId = params?.keyId;
    if (!keyId) return Errors.badRequest('API key ID required');

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
      return Errors.notFound('API key');
    }

    return successResponse({ deleted: true });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

