import { Context, Next } from 'hono';
import type { CloudflareBindings, HonoVariables } from '../../types';
import { getDb } from '../../db/client';
import { getAuthenticatedUser } from '../../lib/auth/middleware';
import { checkPermission } from '../../lib/auth/permissions';
import { userHasAccessToOrganization } from '../../lib/auth/organization-context';
import { Errors } from './hono-response';
import type { User } from '../../db/schema';
import type { Permission } from '../../lib/auth/permissions';
import { hasScope } from './api-keys';
import { apiKeys } from '../../db/schema/api-keys';
import { eq, and, isNull, or, gte } from 'drizzle-orm';
import { compareApiKey, parseScopes } from './api-keys';

/**
 * Validates an API key from the request headers
 */
async function validateApiKeyForAdmin(
  request: Request,
  db: ReturnType<typeof getDb>
): Promise<{ id: string; organizationId: string; scopes: string[] } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const keyPrefix = token.substring(0, 8);

  const { compareApiKey, parseScopes } = await import('./api-keys');

  const keys = await db.query.apiKeys.findMany({
    where: (keys, { eq, and: andFn, isNull: isNullFn, or: orFn, gte: gteFn }) => andFn(
      eq(keys.keyPrefix, keyPrefix),
      isNullFn(keys.revokedAt),
      orFn(
        isNullFn(keys.expiresAt),
        gteFn(keys.expiresAt, new Date())
      )
    ),
    columns: {
      id: true,
      organizationId: true,
      key: true,
      scopes: true,
      lastUsedAt: true,
    },
  });

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

  const { apiKeys: apiKeysTable } = await import('../../db/schema/api-keys');
  const { eq } = await import('drizzle-orm');
  
  await db.update(apiKeysTable)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeysTable.id, validKey.id));

  return {
    id: validKey.id,
    organizationId: validKey.organizationId,
    scopes: parseScopes(validKey.scopes),
  };
}

export interface AuthenticatedContext {
  user: User | null; // null when using API key
  db: ReturnType<typeof getDb>;
  organizationId?: string;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  };
  authMethod?: 'cloudflare-access' | 'api-key';
}

type HonoContext = Context<{ Bindings: CloudflareBindings; Variables: HonoVariables }>;

/**
 * Hono middleware for admin routes that supports both Cloudflare Access and API key authentication
 * Tries API key first, then falls back to Cloudflare Access
 */
export async function authMiddleware(
  c: HonoContext,
  next: Next
) {
  const db = getDb(c.env.DB);
  
  // Try API key authentication first
  const apiKey = await validateApiKeyForAdmin(c.req.raw, db);
  
  if (apiKey) {
    // API key authentication
    // Note: We can't set user to null due to type constraints, so we'll handle it in routes
    c.set('db', db);
    c.set('apiKey', apiKey);
    c.set('organizationId', apiKey.organizationId);
    // Store auth method in a way that works with types
    (c as any).var.authMethod = 'api-key';
    await next();
    return;
  }
  
  // Fall back to Cloudflare Access authentication
  try {
    const user = await getAuthenticatedUser(c.req.raw, db);
    c.set('user', user);
    c.set('db', db);
    (c as any).var.authMethod = 'cloudflare-access';
    await next();
  } catch (error) {
    // If Cloudflare Access fails, return unauthorized
    return c.json(Errors.unauthorized(), 401);
  }
}

/**
 * Hono middleware for organization access check
 * Works with both Cloudflare Access (user-based) and API key (org-based) authentication
 */
export async function orgAccessMiddleware(
  c: HonoContext,
  next: Next
) {
  const orgId = c.req.param('orgId');
  if (!orgId) {
    return c.json(Errors.badRequest('Organization ID required'), 400);
  }

  const db = c.get('db');
  const authMethod = ((c.var as any).authMethod as 'cloudflare-access' | 'api-key') || 'cloudflare-access';
  
  if (authMethod === 'api-key') {
    // For API keys, verify the key belongs to the organization
    const apiKey = c.get('apiKey');
    if (!apiKey || apiKey.organizationId !== orgId) {
      return c.json(Errors.forbidden(), 403);
    }
    c.set('organizationId', orgId);
    await next();
    return;
  }
  
  // For Cloudflare Access, check user access
  const user = c.get('user');
  if (!user) {
    return c.json(Errors.unauthorized(), 401);
  }
  
  const hasAccess = await userHasAccessToOrganization(db, user, orgId);
  if (!hasAccess) {
    return c.json(Errors.forbidden(), 403);
  }

  c.set('organizationId', orgId);
  await next();
}

/**
 * Hono middleware for permission check
 * For API keys, checks scopes. For Cloudflare Access, checks user permissions.
 */
export function permissionMiddleware(requiredPermission: Permission) {
  return async (
    c: HonoContext,
    next: Next
  ) => {
    const orgId = c.get('organizationId');
    if (!orgId) {
      return c.json(Errors.badRequest('Organization ID required'), 400);
    }

    const authMethod = ((c.var as any).authMethod as 'cloudflare-access' | 'api-key') || 'cloudflare-access';
    
    if (authMethod === 'api-key') {
      // Check API key scopes
      const apiKey = c.get('apiKey');
      if (!apiKey) {
        return c.json(Errors.unauthorized(), 401);
      }
      
      const scopes = apiKey.scopes || [];
      if (!hasScope(scopes, requiredPermission)) {
        return c.json(Errors.forbidden(), 403);
      }
      
      await next();
      return;
    }
    
    // For Cloudflare Access, check user permissions
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
      return c.json(Errors.forbidden(), 403);
    }

    await next();
  };
}

/**
 * Helper to get authenticated context from Hono context
 */
export function getAuthContext(c: HonoContext): AuthenticatedContext {
  const authMethod = ((c.var as any).authMethod as 'cloudflare-access' | 'api-key') || 'cloudflare-access';
  const context: AuthenticatedContext = {
    user: authMethod === 'api-key' ? null : (c.get('user') || null),
    db: c.get('db'),
    organizationId: c.get('organizationId'),
    apiKey: c.get('apiKey'),
    authMethod: authMethod as 'cloudflare-access' | 'api-key',
  };
  return context;
}

