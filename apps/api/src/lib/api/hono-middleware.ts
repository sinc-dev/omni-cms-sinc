import { Context, Next } from 'hono';
import type { CloudflareBindings, HonoVariables } from '../../types';
import { getDb } from '../../db/client';
import { getAuthenticatedUser } from '../../lib/auth/middleware';
import { checkPermission } from '../../lib/auth/permissions';
import { userHasAccessToOrganization } from '../../lib/auth/organization-context';
import { Errors } from './hono-response';
import type { User } from '../../db/schema';
import type { Permission } from '../../lib/auth/permissions';

export interface AuthenticatedContext {
  user: User;
  db: ReturnType<typeof getDb>;
  organizationId?: string;
}

type HonoContext = Context<{ Bindings: CloudflareBindings; Variables: HonoVariables }>;

/**
 * Hono middleware for authentication
 * Adds authenticated user and database to context
 */
export async function authMiddleware(
  c: HonoContext,
  next: Next
) {
  const db = getDb(c.env.DB);
        const user = await getAuthenticatedUser(c.req.raw, db, c.env);
  
  c.set('user', user);
  c.set('db', db);
  
  await next();
}

/**
 * Hono middleware for organization access check
 */
export async function orgAccessMiddleware(
  c: HonoContext,
  next: Next
) {
  const orgId = c.req.param('orgId');
  if (!orgId) {
    return c.json(Errors.badRequest('Organization ID required'));
  }

  const db = c.get('db');
  const user = c.get('user');
  
  if (!user) {
    return c.json(Errors.unauthorized(), 401);
  }
  
  const hasAccess = await userHasAccessToOrganization(db, user, orgId);
  if (!hasAccess) {
    return c.json(Errors.forbidden());
  }

  c.set('organizationId', orgId);
  await next();
}

/**
 * Hono middleware for permission check
 */
export function permissionMiddleware(requiredPermission: Permission) {
  return async (
    c: HonoContext,
    next: Next
  ) => {
    const orgId = c.get('organizationId');
    if (!orgId) {
      return c.json(Errors.badRequest('Organization ID required'));
    }

    const db = c.get('db');
    const user = c.get('user');
    
    if (!user) {
      return c.json(Errors.unauthorized(), 401);
    }
    
    const hasPermission = await checkPermission(
      db,
      user.id,
      orgId,
      requiredPermission
    );
    
    if (!hasPermission) {
      return c.json(Errors.forbidden());
    }

    await next();
  };
}

/**
 * Helper to get authenticated context from Hono context
 */
export function getAuthContext(c: HonoContext): AuthenticatedContext {
  const user = c.get('user');
  if (!user) {
    throw new Error('User not authenticated');
  }
  return {
    user,
    db: c.get('db'),
    organizationId: c.get('organizationId'),
  };
}

