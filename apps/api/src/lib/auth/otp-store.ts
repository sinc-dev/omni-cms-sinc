/**
 * OTP Storage Utility
 * Stores OTP codes with expiration and rate limiting using D1 database
 */

import type { DbClient } from '@/db/client';
import { otpCodes } from '@/db/schema/otp-codes';
import { eq, and, gte, desc, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Check rate limit for email
 * @param db - Database client
 * @param email - Email address
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if within rate limit, false otherwise
 */
export async function checkRateLimit(
  db: DbClient,
  email: string,
  maxRequests: number = 3,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  
  // Count OTP requests for this email in the time window
  const recentRequests = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.email, email),
        gte(otpCodes.createdAt, windowStart)
      )
    )
    .orderBy(desc(otpCodes.createdAt));
  
  return recentRequests.length < maxRequests;
}

/**
 * Store OTP code for email
 * @param db - Database client
 * @param email - Email address
 * @param hashedCode - Hashed OTP code
 * @param expiresInMs - Expiration time in milliseconds (default: 10 minutes)
 */
export async function storeOTP(
  db: DbClient,
  email: string,
  hashedCode: string,
  expiresInMs: number = 10 * 60 * 1000 // 10 minutes
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInMs);
  
  // Delete any existing OTP for this email
  await db.delete(otpCodes).where(eq(otpCodes.email, email));
  
  // Insert new OTP
  await db.insert(otpCodes).values({
    id: nanoid(),
    email,
    code: hashedCode,
    expiresAt,
    attempts: 0,
    createdAt: now,
  });
}

/**
 * Verify OTP code
 * @param db - Database client
 * @param email - Email address
 * @param code - Plain text OTP code
 * @param maxAttempts - Maximum verification attempts (default: 3)
 * @returns True if code is valid, false otherwise
 */
export async function verifyOTP(
  db: DbClient,
  email: string,
  code: string,
  maxAttempts: number = 3
): Promise<boolean> {
  const now = new Date();
  
  // Get OTP entry for email
  const otpEntries = await db
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.email, email))
    .limit(1);
  
  const otpEntry = otpEntries[0] || null;
  
  if (!otpEntry) {
    return false; // No OTP found
  }
  
  // Check if expired
  if (otpEntry.expiresAt < now) {
    await db.delete(otpCodes).where(eq(otpCodes.email, email));
    return false; // Expired
  }
  
  // Check if too many attempts
  if (otpEntry.attempts >= maxAttempts) {
    await db.delete(otpCodes).where(eq(otpCodes.email, email));
    return false; // Too many attempts
  }
  
  // Verify code (compare hashed)
  const isValid = await compareOTP(code, otpEntry.code);
  
  if (isValid) {
    // Delete OTP after successful verification
    await db.delete(otpCodes).where(eq(otpCodes.email, email));
    return true;
  }
  
  // Increment attempts
  await db
    .update(otpCodes)
    .set({ attempts: otpEntry.attempts + 1 })
    .where(eq(otpCodes.email, email));
  
  return false;
}

/**
 * Hash OTP code for storage
 * @param code - Plain text OTP code
 * @returns Hashed code
 */
export async function hashOTP(code: string): Promise<string> {
  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare plain text code with hashed code
 * @param plainCode - Plain text OTP code
 * @param hashedCode - Hashed OTP code
 * @returns True if codes match
 */
async function compareOTP(plainCode: string, hashedCode: string): Promise<boolean> {
  const hashedPlain = await hashOTP(plainCode);
  return hashedPlain === hashedCode;
}

/**
 * Generate a random 6-digit OTP code
 * @returns 6-digit code as string
 */
export function generateOTP(): string {
  // Generate random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Delete OTP entry for email
 * @param db - Database client
 * @param email - Email address
 */
export async function deleteOTP(db: DbClient, email: string): Promise<void> {
  await db.delete(otpCodes).where(eq(otpCodes.email, email));
}

/**
 * Clean up expired OTP codes
 * @param db - Database client
 */
export async function cleanupExpiredOTPs(db: DbClient): Promise<void> {
  const now = new Date();
  await db
    .delete(otpCodes)
    .where(lte(otpCodes.expiresAt, now));
}
