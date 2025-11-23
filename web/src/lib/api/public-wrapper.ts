import type { DbClient } from '@/db/client';
import { Errors } from './response';
import { apiKeys } from '@/db/schema/api-keys';
import { eq, and, isNull, or, gte } from 'drizzle-orm';
import { compareApiKey, parseScopes, hasScope } from './api-keys';
import { analyticsEvents } from '@/db/schema/analytics';
import { nanoid } from 'nanoid';

export interface PublicContext {
  db: DbClient;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  };
  organizationId?: string;
}

export type PublicHandler = (
  request: Request,
  context: PublicContext,
  params?: Record<string, string>
) => Promise<Response>;

/**
 * Validates an API key from the request headers
 * @param request - The request object
 * @param db - Database client
 * @returns API key info if valid, null otherwise
 */
async function validateApiKey(
  request: Request,
  db: DbClient
): Promise<{ id: string; organizationId: string; scopes: string[] } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // "Bearer "
  const keyPrefix = token.substring(0, 8); // Assuming 'omni_xxxx' format, take first 8 chars of actual key

  // Find keys with matching prefix
  const keys = await db.query.apiKeys.findMany({
    where: (keys, { eq, and: andFn, isNull: isNullFn, or: orFn, gte: gteFn }) => andFn(
      eq(keys.keyPrefix, keyPrefix),
      isNullFn(keys.revokedAt), // Not revoked
      orFn(
        isNullFn(keys.expiresAt),
        gteFn(keys.expiresAt, new Date())
      ) // Not expired
    ),
    columns: {
      id: true,
      organizationId: true,
      key: true, // Need full key to compare hash
      scopes: true,
      lastUsedAt: true,
    },
  });

  // Compare with all matching keys
  const { compareApiKey } = await import('./api-keys');
  let validKey = null;
  for (const key of keys) {
    if (await compareApiKey(token, key.key)) {
      validKey = key;
      break;
    }
  }

  if (!validKey) {
    return null;
  }

  // Update last used timestamp
  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, validKey.id));

  return {
    id: validKey.id,
    organizationId: validKey.organizationId,
    scopes: parseScopes(validKey.scopes),
  };
}

/**
 * Tracks an analytics event for API usage
 * @param db - Database client
 * @param eventType - Type of event
 * @param organizationId - Organization ID
 * @param apiKeyId - API key ID (if used)
 * @param postId - Post ID (if applicable)
 * @param metadata - Additional metadata
 */
export async function trackApiEvent(
  db: DbClient,
  eventType: string,
  organizationId?: string,
  apiKeyId?: string,
  postId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      postId: postId || null,
      eventType,
      userId: null,
      organizationId: organizationId || null,
      apiKeyId: apiKeyId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipHash: null, // Could hash IP if needed
      userAgent: null,
      referrer: null,
      createdAt: new Date(),
    });
  } catch (error) {
    // Don't fail the request if analytics tracking fails
    console.error('Failed to track analytics event:', error);
  }
}

/**
 * Wraps a public API route handler with database access and optional API key authentication
 * @param handler - The route handler function
 * @param options - Configuration options
 */
export function withPublic(
  handler: PublicHandler,
  options?: {
    requiredScope?: string;
    trackAnalytics?: boolean;
  }
) {
  return async (
    request: Request,
    routeParams?: { params: Record<string, string> }
  ) => {
    try {
      // Get D1 database from Cloudflare binding
      const db = (request as any).db as DbClient;
      
      if (!db) {
        return Errors.serverError('Database not configured');
      }

      // Validate API key if provided
      const apiKey = await validateApiKey(request, db);
      
      // Check required scope if specified
      if (options?.requiredScope && apiKey) {
        const scopes = apiKey.scopes || [];
        if (!hasScope(scopes, options.requiredScope)) {
          return Errors.forbidden();
        }
      }

      // Track analytics if enabled
      if (options?.trackAnalytics && apiKey) {
        const params = routeParams?.params || {};
        const postId = params?.postId || params?.slug;
        await trackApiEvent(
          db,
          `api.${request.method.toLowerCase()}.${params?.orgSlug || 'unknown'}`,
          apiKey.organizationId,
          apiKey.id,
          postId
        );
      }

      // Call the handler with public context
      const params = routeParams?.params || {};
      const context: PublicContext = {
        db,
        apiKey: apiKey || undefined,
        organizationId: apiKey?.organizationId,
      };
      
      return handler(request, context, params);
    } catch (error) {
      if (error instanceof Error) {
        return Errors.serverError(error.message);
      }
      return Errors.serverError();
    }
  };
}

