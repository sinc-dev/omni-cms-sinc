import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { apiKeys } from '@/db/schema/api-keys';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/api/api-keys';

// POST /api/admin/v1/organizations/:orgId/api-keys/:keyId/rotate
// Rotate an API key (create new, invalidate old immediately)
export const POST = withAuth(
  async (request, { db, organizationId }, params) => {
    const keyId = params?.keyId;
    if (!keyId) {
      return Errors.badRequest('API key ID required');
    }

    // Get the existing key
    const existingKey = await db.query.apiKeys.findFirst({
      where: (keys, { eq: eqFn, and: andFn }) => andFn(
        eqFn(keys.id, keyId),
        eqFn(keys.organizationId, organizationId!)
      ),
    });

    if (!existingKey) {
      return Errors.notFound('API key');
    }

    // Check if key is already revoked
    if (existingKey.revokedAt) {
      return Errors.badRequest('API key is already revoked');
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
      const existing = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.key, hashedKey),
      });
      
      if (!existing) {
        isUnique = true;
      } else {
        attempts++;
      }
    }

    if (!isUnique || !plainKey || !hashedKey) {
      return Errors.serverError('Failed to generate unique API key after multiple attempts');
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
        key: hashedKey!, // TypeScript doesn't understand control flow, but we've checked above
        keyPrefix,
        scopes: existingKey.scopes, // Copy scopes from old key
        rateLimit: existingKey.rateLimit,
        rotatedFromId: keyId, // Track rotation chain
        expiresAt: existingKey.expiresAt,
        createdAt: new Date(),
      } as any)
      .returning();

    const keyResult = Array.isArray(newKey) ? newKey[0] : newKey;
    if (!keyResult) {
      return Errors.serverError('Failed to create rotated API key');
    }

    // Return the plain key only once
    return successResponse({
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
    });
  },
  {
    requiredPermission: 'organizations:update',
    requireOrgAccess: true,
  }
);

