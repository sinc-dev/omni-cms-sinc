// API key validation middleware for public API routes

import type { DbClient } from '@/db/client';
import { apiKeys, organizations } from '@/db/schema';
import { eq, and, or, isNull, gt } from 'drizzle-orm';
import { hashApiKey, compareApiKey } from './api-keys';
import { checkApiKeyRateLimit, getRateLimitHeaders } from './rate-limit';

export interface ApiKeyContext {
  apiKey: {
    id: string;
    organizationId: string;
    organizationSlug: string;
    name: string;
    rateLimit: number;
  };
}

/**
 * Validates an API key from the request
 * @param request - The incoming request
 * @param db - The database client
 * @returns API key context or null
 */
export async function validateApiKey(
  request: Request,
  db: DbClient
): Promise<ApiKeyContext | null> {
  const apiKeyHeader = request.headers.get('X-API-Key') || 
                       request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!apiKeyHeader) {
    return null;
  }

  const hashedKey = await hashApiKey(apiKeyHeader);
  const now = Date.now();

  // Find API key by hashed value
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(
      eq(apiKeys.key, hashedKey),
      or(
        isNull(apiKeys.expiresAt),
        gt(apiKeys.expiresAt, new Date(now))
      )
    ),
    with: {
      organization: true,
    },
  });

  if (!apiKey || !apiKey.organization) {
    return null;
  }

  // Check rate limit
  const rateLimitInfo = await checkApiKeyRateLimit(
    db,
    apiKey.id,
    apiKey.rateLimit
  );

  if (!rateLimitInfo.allowed) {
    return null; // Rate limit exceeded
  }

  return {
    apiKey: {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      organizationSlug: apiKey.organization.slug,
      name: apiKey.name,
      rateLimit: apiKey.rateLimit,
    },
  };
}

/**
 * Gets rate limit headers for an API key
 * @param db - The database client
 * @param apiKeyId - The API key ID
 * @param limit - The rate limit
 * @returns Headers object
 */
export async function getApiKeyRateLimitHeaders(
  db: DbClient,
  apiKeyId: string,
  limit: number
): Promise<Record<string, string>> {
  const rateLimitInfo = await checkApiKeyRateLimit(db, apiKeyId, limit);
  return getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt);
}

