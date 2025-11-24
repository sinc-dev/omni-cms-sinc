import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { apiKeys } from '../../db/schema';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../../lib/api/api-keys';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/admin/v1/organizations/:orgId/api-keys/:keyId/rotate
// Rotate an API key (create new, invalidate old immediately)
app.post(
  '/:orgId/api-keys/:keyId/rotate',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('organizations:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const keyId = c.req.param('keyId');

    if (!keyId) {
      return c.json(Errors.badRequest('API key ID required'), 400);
    }

    // Get the existing key
    const existingKey = await db.query.apiKeys.findFirst({
      where: (keys, { eq, and: andFn }) => andFn(
        eq(keys.id, keyId),
        eq(keys.organizationId, organizationId!)
      ),
    });

    if (!existingKey) {
      return c.json(Errors.notFound('API key'), 404);
    }

    // Check if key is already revoked
    if (existingKey.revokedAt) {
      return c.json(Errors.badRequest('API key is already revoked'), 400);
    }

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
        where: (keys, { eq }) => eq(keys.key, hashedKey!),
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

    // Revoke the old key immediately
    await db.update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    // Create new key with same scopes and settings
    const newKey = await db
      .insert(apiKeys)
      .values({
        id: nanoid(),
        organizationId: organizationId!,
        name: `${existingKey.name} (rotated)`,
        key: hashedKey,
        keyPrefix,
        scopes: existingKey.scopes, // Copy scopes from old key
        rateLimit: existingKey.rateLimit,
        rotatedFromId: keyId, // Track rotation chain
        expiresAt: existingKey.expiresAt,
        createdAt: new Date(),
      })
      .returning();

    const keyResult = Array.isArray(newKey) ? newKey[0] : newKey;
    if (!keyResult) {
      return c.json(Errors.serverError('Failed to create rotated API key'), 500);
    }

    // Return the plain key only once
    return c.json(successResponse({
      id: keyResult.id,
      name: keyResult.name,
      key: plainKey, // Show full key only on creation
      keyPrefix: keyResult.keyPrefix,
      scopes: existingKey.scopes ? JSON.parse(existingKey.scopes) : [],
      rateLimit: keyResult.rateLimit,
      rotatedFromId: keyResult.rotatedFromId,
      createdAt: keyResult.createdAt,
      expiresAt: keyResult.expiresAt,
      warning: 'Store this key securely. The old key has been revoked and will not work. This new key will not be shown again.',
    }));
  }
);

export default app;

