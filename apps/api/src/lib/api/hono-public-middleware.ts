import { Context, Next } from 'hono';
import type { CloudflareBindings, HonoVariables } from '../../types';
import { getDb } from '../../db/client';
import { Errors } from './hono-response';
import { apiKeys } from '../../db/schema/api-keys';
import { eq, and, isNull, or, gte } from 'drizzle-orm';
import { compareApiKey, parseScopes, hasScope } from './api-keys';
import { analyticsEvents } from '../../db/schema/analytics';
import { nanoid } from 'nanoid';

export interface PublicContext {
  db: ReturnType<typeof getDb>;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  };
  organizationId?: string;
}

type HonoContext = Context<{ Bindings: CloudflareBindings; Variables: HonoVariables }>;

/**
 * Validates an API key from the request headers
 */
async function validateApiKey(
  request: Request,
  db: ReturnType<typeof getDb>
): Promise<{ id: string; organizationId: string; scopes: string[] } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const keyPrefix = token.substring(0, 8);

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

  const { compareApiKey: compare } = await import('./api-keys');
  let validKey = null;
  for (const key of keys) {
    if (await compare(token, key.key)) {
      validKey = key;
      break;
    }
  }

  if (!validKey) {
    return null;
  }

  await db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, validKey.id));

  return {
    id: validKey.id,
    organizationId: validKey.organizationId,
    scopes: parseScopes(validKey.scopes),
  };
}

/**
 * Tracks an analytics event for API usage
 */
export async function trackApiEvent(
  db: ReturnType<typeof getDb>,
  eventType: string,
  organizationId?: string,
  apiKeyId?: string,
  postId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      eventType,
      organizationId: organizationId || null,
      userId: null,
      postId: postId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to track API event:', error);
  }
}

/**
 * Hono middleware for public API routes with optional API key authentication
 */
export function publicMiddleware(options?: {
  requiredScope?: string;
  trackAnalytics?: boolean;
  requireApiKey?: boolean;
}) {
  return async (c: HonoContext, next: Next) => {
    const db = getDb(c.env.DB);
    let apiKey = null;
    let organizationIdFromApiKey: string | undefined;

    // Only validate API key if required or if a scope is required
    if (options?.requireApiKey || options?.requiredScope) {
      apiKey = await validateApiKey(c.req.raw, db);
      if (!apiKey) {
        return c.json(Errors.unauthorized(), 401);
      }
      organizationIdFromApiKey = apiKey.organizationId;
    }

    // If API key is not required, but orgSlug is in params, try to get orgId from slug
    const orgSlugParam = c.req.param('orgSlug');
    let organizationIdFromSlug: string | undefined;
    if (!apiKey && orgSlugParam) {
      const organization = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.slug, orgSlugParam),
        columns: { id: true },
      });
      organizationIdFromSlug = organization?.id;
    }

    const finalOrganizationId = organizationIdFromApiKey || organizationIdFromSlug;

    // Check required scope if specified
    if (options?.requiredScope && apiKey) {
      const scopes = apiKey.scopes || [];
      if (!hasScope(scopes, options.requiredScope)) {
        return c.json(Errors.forbidden(), 403);
      }
    }

    // Track analytics if enabled
    if (options?.trackAnalytics && finalOrganizationId) {
      const params = c.req.param();
      const postId = params?.postId || params?.slug;
      await trackApiEvent(
        db,
        `api.${c.req.method.toLowerCase()}.${params?.orgSlug || 'unknown'}`,
        finalOrganizationId,
        apiKey?.id,
        postId
      );
    }

    // Set context
    c.set('db', db);
    if (apiKey) {
      c.set('apiKey', apiKey);
    }
    if (finalOrganizationId) {
      c.set('organizationId', finalOrganizationId);
    }

    await next();
  };
}

/**
 * Helper to get public context from Hono context
 */
export function getPublicContext(c: HonoContext): PublicContext {
  return {
    db: c.get('db'),
    apiKey: c.get('apiKey'),
    organizationId: c.get('organizationId'),
  };
}

