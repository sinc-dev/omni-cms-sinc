import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { validateRequest } from '@/lib/api/validation';
import { getPaginationParams, getOffset } from '@/lib/api/validation';
import { apiKeys } from '@/db/schema/api-keys';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/api/api-keys';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import type { ApiKey } from '@/db/schema/api-keys';

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(z.string()).optional().default([]),
  rateLimit: z.number().int().positive().optional().default(10000),
  expiresAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/v1/organizations/:orgId/api-keys
export const GET = withAuth(
  async (request, { db, organizationId }, params) => {
    const url = new URL(request.url);
    const { page, perPage } = getPaginationParams(url);
    const offset = getOffset(page, perPage);

    const allKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, organizationId!))
      .limit(perPage)
      .offset(offset)
      .orderBy(desc(apiKeys.createdAt));

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiKeys)
      .where(eq(apiKeys.organizationId, organizationId!));
    const total = totalResult[0]?.count || 0;

    // Return keys without the hashed key value for security
    const safeKeys = allKeys.map((key: any) => ({
      id: key.id,
      organizationId: key.organizationId,
      name: key.name,
      keyPrefix: key.keyPrefix, // Only show prefix, not full key
      scopes: key.scopes ? JSON.parse(key.scopes) : [],
      rateLimit: key.rateLimit,
      revokedAt: key.revokedAt || null,
      rotatedFromId: key.rotatedFromId || null,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
    }));

    return paginatedResponse(safeKeys, page, perPage, total);
  },
  {
    requiredPermission: 'organizations:read',
    requireOrgAccess: true,
  }
);

// POST /api/admin/v1/organizations/:orgId/api-keys
export const POST = withAuth(
  async (request, { db, organizationId }, params) => {
    const validation = await validateRequest(request, createApiKeySchema);
    if (!validation.success) return validation.response;

    // Generate new API key (ensure uniqueness)
    let plainKey: string;
    let hashedKey: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      plainKey = await generateApiKey();
      hashedKey = await hashApiKey(plainKey);
      
      // Check if key already exists
      const existing = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key, hashedKey),
      });
      
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique) {
      return Errors.serverError('Failed to generate unique API key after multiple attempts');
    }

    const keyPrefix = getKeyPrefix(plainKey!);

    // Parse expiresAt if provided
    let expiresAt: Date | null = null;
    if (validation.data.expiresAt) {
      expiresAt = new Date(validation.data.expiresAt);
    }

    // Serialize scopes to JSON
    const scopesJson = JSON.stringify(validation.data.scopes || []);

    const newKey = await db
      .insert(apiKeys)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name: validation.data.name,
        key: hashedKey!,
        keyPrefix,
        scopes: scopesJson,
        rateLimit: validation.data.rateLimit,
        expiresAt,
        createdAt: new Date(),
      } as any)
      .returning();

    const keyResult = Array.isArray(newKey) ? newKey[0] : newKey;
    if (!keyResult) {
      return Errors.serverError('Failed to create API key');
    }

    // Return the plain key only once for the client to store
    // After this, only the hashed version exists in the database
    return successResponse({
      id: keyResult.id,
      name: keyResult.name,
      key: plainKey!, // Show full key only on creation
      keyPrefix: keyResult.keyPrefix,
      scopes: validation.data.scopes || [],
      rateLimit: keyResult.rateLimit,
      createdAt: keyResult.createdAt,
      expiresAt: keyResult.expiresAt,
      warning: 'Store this key securely. It will not be shown again.',
    });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

