// API key generation, hashing, and validation utilities
// Uses Web Crypto API for Cloudflare Workers/Pages compatibility

import type { DbClient } from '@/db/client';
import { eq } from 'drizzle-orm';

/**
 * Generates a new API key
 * Format: omni_<random 32 chars>
 * @returns The generated API key
 */
export async function generateApiKey(): Promise<string> {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const key = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `omni_${key}`;
}

/**
 * Hashes an API key for storage using Web Crypto API
 * @param key - The API key to hash
 * @returns The hashed key as hex string
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hashes an API key synchronously (for compatibility)
 * @param key - The API key to hash
 * @returns The hashed key as hex string
 */
export function hashApiKeySync(key: string): string {
  // Simple synchronous hash for Cloudflare compatibility
  // In practice, use async version
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to hex
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Gets the prefix (first 8 chars after 'omni_') for identification
 * @param key - The API key
 * @returns The key prefix
 */
export function getKeyPrefix(key: string): string {
  if (!key.startsWith('omni_')) {
    return key.substring(0, 8);
  }
  return key.substring(5, 13); // After 'omni_', take 8 chars
}

/**
 * Compares an API key with a hashed key
 * @param key - The plain API key
 * @param hashedKey - The stored hashed key
 * @returns True if keys match
 */
export async function compareApiKey(key: string, hashedKey: string): Promise<boolean> {
  const hashed = await hashApiKey(key);
  return hashed === hashedKey;
}

/**
 * Validates if an API key has a required scope
 * @param apiKeyScopes - Array of scopes from the API key
 * @param requiredScope - The scope to check for
 * @returns True if the key has the required scope
 */
export function hasScope(apiKeyScopes: string[] | null, requiredScope: string): boolean {
  if (!apiKeyScopes || apiKeyScopes.length === 0) {
    return false;
  }

  // Check for exact match
  if (apiKeyScopes.includes(requiredScope)) {
    return true;
  }

  // Check for wildcard scopes (e.g., 'posts:*' matches 'posts:read')
  const scopeParts = requiredScope.split(':');
  if (scopeParts.length === 2) {
    const wildcardScope = `${scopeParts[0]}:*`;
    if (apiKeyScopes.includes(wildcardScope)) {
      return true;
    }
  }

  // Check for global wildcard
  if (apiKeyScopes.includes('*:read') || apiKeyScopes.includes('*')) {
    return true;
  }

  return false;
}

/**
 * Parses scopes from JSON string
 * @param scopesJson - JSON string of scopes array
 * @returns Array of scope strings
 */
export function parseScopes(scopesJson: string | null): string[] {
  if (!scopesJson) {
    return [];
  }
  try {
    return JSON.parse(scopesJson) as string[];
  } catch {
    return [];
  }
}

/**
 * Validates API key uniqueness by checking if the hashed key already exists
 * @param db - Database client
 * @param hashedKey - The hashed API key to check
 * @returns True if key is unique (doesn't exist)
 */
export async function isApiKeyUnique(
  db: DbClient,
  hashedKey: string
): Promise<boolean> {
  const existing = await db.query.apiKeys.findFirst({
    where: (keys, { eq: eqFn }) => eqFn(keys.key, hashedKey),
  });
  return !existing;
}

