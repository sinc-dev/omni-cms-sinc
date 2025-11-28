import type { DbClient } from '@/db/client';
import type { User } from '@/db/schema/users';

/**
 * Creates a mock request with authentication context
 * This bypasses the actual auth wrapper for testing
 */
export function createMockAuthRequest(
  url: string,
  db: DbClient,
  user: User,
  options: RequestInit = {}
): Request {
  const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
  const request = new Request(fullUrl, options);
  
  // Inject database and user into request (as withAuth does)
  (request as Request & { db?: DbClient; user?: User }).db = db;
  (request as Request & { db?: DbClient; user?: User }).user = user;
  
  return request;
}

/**
 * Mocks the getAuthenticatedUser function for testing
 */
export async function mockGetAuthenticatedUser(
  request: Request,
  db: DbClient,
  userId: string
): Promise<User> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

