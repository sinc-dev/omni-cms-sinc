/**
 * Session Management
 * Handles user sessions after OTP authentication using D1 database
 */

import { nanoid } from 'nanoid';
import type { User } from '@/db/schema';
import type { DbClient } from '@/db/client';
import { sessions } from '@/db/schema/sessions';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Create a new session for a user
 * @param db - Database client
 * @param user - User object
 * @param expiresInMs - Session expiration time in milliseconds (default: 7 days)
 * @returns Session object with token
 */
export async function createSession(
  db: DbClient,
  user: User,
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMs);
  const sessionId = nanoid();
  const token = generateSessionToken();
  
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt,
    createdAt: now,
  });
  
  return {
    id: sessionId,
    userId: user.id,
    token,
    expiresAt: expiresAt.getTime(),
    createdAt: now.getTime(),
  };
}

/**
 * Get session by token
 * @param db - Database client
 * @param token - Session token
 * @returns Session object or null if not found/expired
 */
export async function getSessionByToken(
  db: DbClient,
  token: string
) {
  const now = new Date();
  
  const sessionResults = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.token, token),
        gte(sessions.expiresAt, now)
      )
    )
    .limit(1);
  
  const session = sessionResults[0] || null;
  
  if (!session) {
    return null;
  }
  
  return {
    id: session.id,
    userId: session.userId,
    token: session.token,
    expiresAt: session.expiresAt.getTime(),
    createdAt: session.createdAt.getTime(),
  };
}

/**
 * Delete session by token
 * @param db - Database client
 * @param token - Session token
 */
export async function deleteSession(db: DbClient, token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

/**
 * Delete all sessions for a user
 * @param db - Database client
 * @param userId - User ID
 */
export async function deleteUserSessions(db: DbClient, userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Generate a secure session token
 * @returns Random token string
 */
function generateSessionToken(): string {
  // Generate a secure random token
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Refresh session expiration
 * @param db - Database client
 * @param token - Session token
 * @param expiresInMs - New expiration time in milliseconds
 * @returns True if session was refreshed, false otherwise
 */
export async function refreshSession(
  db: DbClient,
  token: string,
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): Promise<boolean> {
  const session = await getSessionByToken(db, token);
  if (!session) {
    return false;
  }
  
  const newExpiresAt = new Date(Date.now() + expiresInMs);
  await db
    .update(sessions)
    .set({ expiresAt: newExpiresAt })
    .where(eq(sessions.token, token));
  
  return true;
}

/**
 * Clean up expired sessions
 * @param db - Database client
 */
export async function cleanupExpiredSessions(db: DbClient): Promise<void> {
  const now = new Date();
  await db
    .delete(sessions)
    .where(lte(sessions.expiresAt, now));
}
