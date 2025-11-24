import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { DbClient } from '@/db/client';
import { users } from '@/db/schema';
import { validateAccessJWT, getAccessToken } from './cloudflare-access';
import type { User } from '@/db/schema';

/**
 * Gets the authenticated user from the request
 * Auto-provisions the user on first login if they don't exist
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
  }
): Promise<User> {
  const token = getAccessToken(request);

  if (!token) {
    throw new Error('Unauthorized: No Cloudflare Access token found');
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
