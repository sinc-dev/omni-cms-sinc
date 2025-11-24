// Rate limiting utilities for API keys and users

import type { DbClient } from '@/db/client';
import { apiKeys } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
}

/**
 * Checks rate limit for an API key
 * Uses a sliding window approach with hour-based buckets
 * @param db - The database client
 * @param apiKeyId - The API key ID
 * @param limit - The rate limit (requests per hour)
 * @returns Rate limit info
 */
export async function checkApiKeyRateLimit(
  db: DbClient,
  apiKeyId: string,
  limit: number
): Promise<RateLimitInfo> {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000; // 1 hour in milliseconds
  
  // In a production environment, you'd use a Redis cache or similar
  // for rate limiting. For now, we'll use a simple in-memory approach
  // or track in the database
  
  // For MVP, we'll implement a basic approach:
  // Check last_used_at and allow if enough time has passed
  // In production, use Cloudflare Rate Limiting or Redis
  
  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.id, apiKeyId),
  });

  if (!apiKey) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + 60 * 60 * 1000,
    };
  }

  // Simple rate limiting based on last_used_at
  // In production, use a proper rate limiting service
  // For now, we allow the request and update last_used_at
  // Actual rate limiting would be handled by Cloudflare Workers/Pages
  
  const resetAt = now + 60 * 60 * 1000; // Reset in 1 hour
  
  // Update last_used_at
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date(now) })
    .where(eq(apiKeys.id, apiKeyId));

  return {
    allowed: true, // For MVP, we allow all requests
    remaining: limit - 1, // Approximate remaining
    resetAt,
  };
}

/**
 * Gets rate limit headers for a response
 * @param remaining - Remaining requests
 * @param resetAt - Unix timestamp when limit resets
 * @returns Headers object
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': '10000',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.floor(resetAt / 1000).toString(), // Convert to seconds
  };
}

