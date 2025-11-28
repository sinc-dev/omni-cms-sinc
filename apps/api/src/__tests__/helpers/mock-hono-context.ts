import type { Context } from 'hono';
import type { CloudflareBindings, HonoVariables } from '../../types';
import type { User } from '../../db/schema';
import type { AuthenticatedContext } from '../../lib/api/hono-admin-middleware';
import { createMockBindings, createSimpleMockD1 } from './mock-cloudflare-bindings';
import { getDb } from '../../db/client';
import type { DbClient } from '../../db/client';

/**
 * Creates a mock Hono context for testing
 */
export interface MockHonoContext extends Context<{ Bindings: CloudflareBindings; Variables: HonoVariables }> {}

/**
 * Options for creating a mock context
 */
export interface CreateMockContextOptions {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  user?: User | null;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  } | null;
  organizationId?: string;
  authMethod?: 'cloudflare-access' | 'api-key';
  env?: Partial<CloudflareBindings>;
}

/**
 * Creates a mock Hono context for testing
 */
export function createMockContext(
  options: CreateMockContextOptions = {}
): MockHonoContext {
  const {
    method = 'GET',
    url = 'http://localhost:8787',
    headers = {},
    body,
    params = {},
    query = {},
    user = null,
    apiKey = null,
    organizationId,
    authMethod = user ? 'cloudflare-access' : apiKey ? 'api-key' : undefined,
    env,
  } = options;

  // Build URL with query params
  const urlObj = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });
  const fullUrl = urlObj.toString();

  // Create bindings (using simple mocks for unit tests - no Miniflare)
  const bindings = createMockBindings(env);
  
  // Get database from bindings (always uses simple mocks unless overridden)
  const db = getDb(bindings.DB);

  // Create request
  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body) {
    if (body instanceof FormData || body instanceof URLSearchParams) {
      requestInit.body = body;
    } else {
      requestInit.body = JSON.stringify(body);
      if (!headers['Content-Type']) {
        requestInit.headers = new Headers({
          ...headers,
          'Content-Type': 'application/json',
        });
      }
    }
  }

  const request = new Request(fullUrl, requestInit);

  // Create mock context
  const mockContext = {
    req: {
      raw: request,
      url: fullUrl,
      method: method as any,
      header: (name: string) => request.headers.get(name) || undefined,
      query: (key: string) => urlObj.searchParams.get(key) || undefined,
      param: (key: string) => params[key] || undefined,
      json: async () => {
        if (body && typeof body === 'object' && !(body instanceof FormData)) {
          return body;
        }
        return request.json();
      },
      text: async () => request.text(),
      parseBody: async () => {
        if (body instanceof FormData) return body;
        if (body instanceof URLSearchParams) return body;
        return request.json();
      },
    },
    env: bindings,
    var: {
      user,
      db,
      organizationId: organizationId || params.orgId || (apiKey?.organizationId),
      apiKey,
      authMethod,
    } as HonoVariables,
    json: (data: any, status?: number) => {
      return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    text: (text: string, status?: number) => {
      return new Response(text, {
        status: status || 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    },
    html: (html: string, status?: number) => {
      return new Response(html, {
        status: status || 200,
        headers: { 'Content-Type': 'text/html' },
      });
    },
    status: (code: number) => ({
      json: (data: any) => new Response(JSON.stringify(data), {
        status: code,
        headers: { 'Content-Type': 'application/json' },
      }),
      text: (text: string) => new Response(text, {
        status: code,
        headers: { 'Content-Type': 'text/plain' },
      }),
    }),
  } as any;

  return mockContext;
}

/**
 * Creates a mock context with authenticated user
 */
export function createAuthenticatedContext(
  user: User,
  options: Omit<CreateMockContextOptions, 'user'> = {}
): MockHonoContext {
  return createMockContext({
    ...options,
    user,
    authMethod: 'cloudflare-access',
  });
}

/**
 * Creates a mock context with API key authentication
 */
export function createApiKeyContext(
  apiKey: { id: string; organizationId: string; scopes: string[] },
  options: Omit<CreateMockContextOptions, 'apiKey'> = {}
): MockHonoContext {
  return createMockContext({
    ...options,
    apiKey,
    organizationId: apiKey.organizationId,
    authMethod: 'api-key',
    headers: {
      ...options.headers,
      Authorization: `Bearer omni_test_${apiKey.id}`,
    },
  });
}

/**
 * Creates a mock context with organization context
 */
export function createOrgContext(
  organizationId: string,
  user: User | null = null,
  options: Omit<CreateMockContextOptions, 'organizationId' | 'user'> = {}
): MockHonoContext {
  return createMockContext({
    ...options,
    organizationId,
    user,
    authMethod: user ? 'cloudflare-access' : undefined,
  });
}

/**
 * Creates an unauthenticated mock context
 */
export function createUnauthenticatedContext(
  options: Omit<CreateMockContextOptions, 'user' | 'apiKey'> = {}
): MockHonoContext {
  return createMockContext({
    ...options,
    user: null,
    apiKey: null,
    authMethod: undefined,
  });
}