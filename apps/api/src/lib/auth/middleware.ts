import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DbClient } from '@/db/client';
import { users } from '@/db/schema';
import { validateAccessJWT, getAccessToken } from './cloudflare-access';
import { getSessionByToken } from './session';
import type { User } from '@/db/schema';

/**
 * Gets the authenticated user from the request
 * Auto-provisions the user on first login if they don't exist
 * Supports local development bypass when ENABLE_LOCAL_AUTH_BYPASS is enabled
 * @param request - The incoming request
 * @param db - The database client
 * @param env - Environment variables from Cloudflare Workers (c.env)
 * @returns The authenticated user
 * @throws Error if authentication fails
 */
export async function getAuthenticatedUser(
  request: Request,
  db: DbClient,
  env?: {
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    ENABLE_LOCAL_AUTH_BYPASS?: string;
  }
): Promise<User> {
  // Try to get session token from Authorization header (for OTP authentication)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionToken = authHeader.substring(7);
    const session = await getSessionByToken(db, sessionToken);
    
    if (session) {
      // Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, session.userId),
      });
      
      if (user) {
        return user;
      }
    }
  }

  // Fall back to Cloudflare Access token
  const token = getAccessToken(request);
  const enableLocalAuthBypass = env?.ENABLE_LOCAL_AUTH_BYPASS === 'true';

  // Local development bypass: if enabled and no token, use demo user
  if (enableLocalAuthBypass && !token) {
    const demoEmail = 'demo@example.com';
    
    // Get or create demo user
    let demoUser = await db.query.users.findFirst({
      where: eq(users.email, demoEmail),
    });

    if (!demoUser) {
      // Create demo user if it doesn't exist
      const newUser = await db
        .insert(users)
        .values({
          id: nanoid(),
          email: demoEmail,
          name: 'Demo User',
          isSuperAdmin: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      demoUser = newUser[0];
    }

    return demoUser;
  }

  if (!token) {
    throw new Error('Unauthorized: No authentication token found');
  }

  const teamDomain = env?.CF_ACCESS_TEAM_DOMAIN;
  const aud = env?.CF_ACCESS_AUD;

  if (!teamDomain || !aud) {
    throw new Error('Server configuration error: Cloudflare Access not configured');
  }

  // Validate the JWT
  const payload = await validateAccessJWT(token, teamDomain, aud);

  // Get or create user in database
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, payload.email),
  });

  if (existingUser) {
    return existingUser;
  }

  // Auto-provision user on first login
  const newUser = await db
    .insert(users)
    .values({
      id: nanoid(),
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      isSuperAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newUser[0];
}

/**
 * Checks if a user is a super admin
 * @param user - The user to check
 * @returns True if the user is a super admin
 */
export function isSuperAdmin(user: User): boolean {
  return user.isSuperAdmin;
}
