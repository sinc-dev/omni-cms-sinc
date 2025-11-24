import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, paginatedResponse, Errors } from '../../lib/api/hono-response';
import { getPaginationParams, getOffset } from '../../lib/api/validation';
import { apiKeys } from '../../db/schema';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../../lib/api/api-keys';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  scopes: z.array(z.string()).optional().default([]),
  rateLimit: z.number().int().positive().optional().default(10000),
  expiresAt: z.string().datetime().optional().nullable(),
});

// GET /api/admin/v1/organizations/:orgId/api-keys
app.get(
  '/:orgId/api-keys',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const url = new URL(c.req.url);
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

    return c.json(paginatedResponse(safeKeys, page, perPage, total));
  }
);

// POST /api/admin/v1/organizations/:orgId/api-keys
app.post(
  '/:orgId/api-keys',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    
    try {
      const body = await c.req.json();
      const keyData = createApiKeySchema.parse(body);

      // Generate new API key (ensure uniqueness)
      let plainKey: string | undefined;
      let hashedKey: string | undefined;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        plainKey = await generateApiKey();
        hashedKey = await hashApiKey(plainKey);
        
        // Check if key already exists
        if (!hashedKey) {
          attempts++;
          continue;
        }
        const existing = await db.query.apiKeys.findFirst({
          where: (ak, { eq }) => eq(ak.key, hashedKey!),
        });
        
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
        }
      }

      if (!isUnique || !plainKey || !hashedKey) {
        return c.json(Errors.serverError('Failed to generate unique API key after multiple attempts'), 500);
      }

      const keyPrefix = getKeyPrefix(plainKey);

      // Parse expiresAt if provided
      let expiresAt: Date | null = null;
      if (keyData.expiresAt) {
        expiresAt = new Date(keyData.expiresAt);
      }

      // Serialize scopes to JSON
      const scopesJson = JSON.stringify(keyData.scopes || []);

      const newKey = await db
        .insert(apiKeys)
        .values({
          id: nanoid(),
          organizationId: organizationId!,
          name: keyData.name,
          key: hashedKey,
          keyPrefix,
          scopes: scopesJson,
          rateLimit: keyData.rateLimit,
          expiresAt,
          createdAt: new Date(),
        } as any)
        .returning();

      const keyResult = Array.isArray(newKey) ? newKey[0] : newKey;
      if (!keyResult) {
        return c.json(Errors.serverError('Failed to create API key'), 500);
      }

      // Return the plain key only once for the client to store
      // After this, only the hashed version exists in the database
      return c.json(successResponse({
        id: keyResult.id,
        name: keyResult.name,
        key: plainKey, // Show full key only on creation
        keyPrefix: keyResult.keyPrefix,
        scopes: keyData.scopes || [],
        rateLimit: keyResult.rateLimit,
        createdAt: keyResult.createdAt,
        expiresAt: keyResult.expiresAt,
        warning: 'Store this key securely. It will not be shown again.',
      }));
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      console.error('Error creating API key:', error);
      return c.json(Errors.serverError(
        error instanceof Error ? error.message : 'Failed to create API key'
      ), 500);
    }
  }
);

export default app;

