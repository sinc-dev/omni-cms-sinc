import type { CloudflareBindings } from '../../types';
import { Miniflare } from 'miniflare';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

/**
 * Creates mock Cloudflare bindings for testing
 */
export interface MockCloudflareBindings extends CloudflareBindings {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

/**
 * Creates a mock D1Database using Miniflare (for integration tests with real D1)
 * Uses wrangler.toml configuration and runs migrations automatically
 * Note: Use createSimpleMockD1 for unit tests (faster, no real DB)
 * 
 * @returns D1Database instance (Miniflare instance should be stored separately for cleanup)
 */
export async function createMockD1(): Promise<D1Database> {
  // Import dynamically to avoid issues if file doesn't exist
  const { createIntegrationD1 } = await import('./integration-d1');
  const { db } = await createIntegrationD1();
  return db;
}

/**
 * Creates a mock R2Bucket using Miniflare (for integration tests only)
 */
export async function createMockR2(): Promise<R2Bucket> {
  const mf = new Miniflare({
    script: `export default {
      async fetch() {
        return new Response('OK');
      }
    }`,
    r2Buckets: ['R2_BUCKET'],
  });
  return await mf.getR2Bucket('R2_BUCKET');
}

/**
 * Creates mock Cloudflare bindings for testing
 * Uses simple mocks by default for faster unit tests (no Miniflare runtime required)
 */
export function createMockBindings(
  overrides?: Partial<CloudflareBindings>
): MockCloudflareBindings {
  // Use simple mocks by default - faster and no Miniflare runtime needed
  const DB = overrides?.DB || createSimpleMockD1();
  const R2_BUCKET = overrides?.R2_BUCKET || createSimpleMockR2();

  return {
    DB,
    R2_BUCKET,
    R2_ACCOUNT_ID: 'test-account-id',
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://test.r2.dev',
    CF_ACCESS_TEAM_DOMAIN: 'test-team.cloudflareaccess.com',
    CF_ACCESS_AUD: 'test-aud',
    OPENAI_API_KEY: 'test-openai-key',
    APP_URL: 'http://localhost:8787',
    RESEND_API_KEY: 'test-resend-key',
    EMAIL_FROM: 'test@example.com',
    EMAIL_FROM_NAME: 'Test App',
    ...overrides,
  };
}

/**
 * Simple in-memory mock for D1Database (for unit tests)
 */
export function createSimpleMockD1(): D1Database {
  const data: Map<string, any[]> = new Map();

  return {
    prepare: (query: string) => {
      return {
        bind: (...values: any[]) => ({
          first: async () => {
            // Simple mock - return null for now
            // In real tests, this should be customized per test
            return null;
          },
          run: async () => ({} as any),
          all: async () => ({ results: [] } as any),
          raw: async () => [],
        }),
        first: async () => null,
        run: async () => ({} as any),
        all: async () => ({ results: [] } as any),
        raw: async () => [],
      };
    },
    batch: async () => [],
    exec: async () => ({} as any),
  } as D1Database;
}

/**
 * Simple in-memory mock for R2Bucket (for unit tests)
 */
export function createSimpleMockR2(): R2Bucket {
  const files: Map<string, ArrayBuffer> = new Map();

  return {
    head: async (key: string) => {
      if (files.has(key)) {
        return {
          key,
          size: files.get(key)!.byteLength,
          etag: 'mock-etag',
          uploaded: new Date(),
          checksums: {},
          httpEtag: 'mock-etag',
        } as R2Object;
      }
      return null;
    },
    get: async (key: string) => {
      const data = files.get(key);
      if (!data) return null;
      return {
        key,
        body: data,
        bodyUsed: false,
        size: data.byteLength,
        etag: 'mock-etag',
        uploaded: new Date(),
        checksums: {},
        httpEtag: 'mock-etag',
        range: undefined,
      } as R2ObjectBody;
    },
    put: async (key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob) => {
      const buffer = value instanceof ArrayBuffer 
        ? value 
        : value instanceof ReadableStream
        ? await new Response(value).arrayBuffer()
        : typeof value === 'string'
        ? new TextEncoder().encode(value)
        : new Uint8Array(value as ArrayBufferView);
      
      files.set(key, buffer);
      return {
        key,
        version: 'mock-version',
        etag: 'mock-etag',
        httpEtag: 'mock-etag',
        checksums: {},
      } as R2PutOptions;
    },
    delete: async (keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => files.delete(key));
      return {} as void;
    },
    list: async (options?: R2ListOptions) => {
      const results: R2Object[] = [];
      const prefix = options?.prefix || '';
      
      for (const [key, data] of files.entries()) {
        if (key.startsWith(prefix)) {
          results.push({
            key,
            size: data.byteLength,
            etag: 'mock-etag',
            uploaded: new Date(),
            checksums: {},
            httpEtag: 'mock-etag',
          } as R2Object);
        }
      }
      
      return {
        objects: results,
        truncated: false,
        cursor: '',
        delimitedPrefixes: [],
      } as R2Objects;
    },
  } as R2Bucket;
}