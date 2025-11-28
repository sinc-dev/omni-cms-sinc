import type { CloudflareBindings } from '../../types';
import { Miniflare } from 'miniflare';
import type { D1Database, D1DatabaseSession, R2Bucket, R2Object, R2ObjectBody, R2PutOptions, R2ListOptions, R2Objects, R2GetOptions, R2MultipartUpload } from '@cloudflare/workers-types';

/**
 * Creates mock Cloudflare bindings for testing
 * Note: Using type assertion to work around multiple @cloudflare/workers-types versions
 */
export interface MockCloudflareBindings extends Omit<CloudflareBindings, 'R2_BUCKET'> {
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
  return await mf.getR2Bucket('R2_BUCKET') as unknown as R2Bucket;
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
  // Use double type assertion to work around multiple @cloudflare/workers-types versions
  const R2_BUCKET = (overrides?.R2_BUCKET || createSimpleMockR2()) as unknown as R2Bucket;

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
      const createPreparedStatement = () => {
        const stmt = {
          bind: (...values: any[]) => stmt,
          first: async () => {
            // Simple mock - return null for now
            // In real tests, this should be customized per test
            return null;
          },
          run: async () => ({} as any),
          all: async () => ({ results: [] } as any),
          raw: async () => [[]] as [string[], ...any[]],
      };
        return stmt;
      };
      return createPreparedStatement();
    },
    batch: async () => [],
    exec: async () => ({} as any),
    withSession: (constraintOrBookmark?: string) => {
      // Simple mock - return a session instance
      const createPreparedStatement = () => {
        const stmt = {
          bind: (...values: any[]) => stmt,
          first: async () => null,
          run: async () => ({} as any),
          all: async () => ({ results: [] } as any),
          raw: async () => [[]] as [string[], ...any[]],
        };
        return stmt;
      };
      const session: D1DatabaseSession = {
        prepare: (query: string) => createPreparedStatement(),
        batch: async () => [],
        getBookmark: () => '',
      } as D1DatabaseSession;
      return session;
    },
    dump: async () => {
      return new Uint8Array(0).buffer;
    },
  } as D1Database;
}

/**
 * Simple in-memory mock for R2Bucket (for unit tests)
 */
export function createSimpleMockR2(): R2Bucket {
  const files: Map<string, ArrayBuffer> = new Map();

  const createR2Object = (key: string, data: ArrayBuffer): R2Object => {
    const obj: R2Object = {
      key,
      size: data.byteLength,
      etag: 'mock-etag',
      uploaded: new Date(),
      checksums: {
        toJSON: () => ({}),
      },
      httpEtag: 'mock-etag',
      version: 'mock-version',
      storageClass: 'Standard',
      httpMetadata: {},
      customMetadata: {},
      writeHttpMetadata: ((headers: Headers) => {
        // Mock implementation - Headers type mismatch between Miniflare and Cloudflare types is acceptable for mocks
      }) as unknown as (headers: Headers) => void,
    } as R2Object;
    return obj;
  };

  return {
    head: async (key: string) => {
      if (files.has(key)) {
        return createR2Object(key, files.get(key)!);
      }
      return null;
    },
    get: async (key: string, options?: R2GetOptions) => {
      const data = files.get(key);
      if (!data) return null;
      
      const obj = createR2Object(key, data);
      const arr = new Uint8Array(data);
      const body: R2ObjectBody = {
        ...obj,
        body: data as any, // Type assertion needed for mock
        bodyUsed: false,
        arrayBuffer: async () => data,
        bytes: async () => arr,
        text: async () => new TextDecoder().decode(data),
        json: async () => JSON.parse(new TextDecoder().decode(data)),
        blob: async () => new Blob([data]) as unknown as Blob,
        writeHttpMetadata: ((headers: Headers) => {
          // Mock implementation
        }) as unknown as (headers: Headers) => void,
      };
      return body;
    },
    put: async (key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: R2PutOptions) => {
      let buffer: ArrayBuffer;
      
      if (value instanceof ArrayBuffer) {
        buffer = value;
      } else if (value instanceof ReadableStream) {
        buffer = await new Response(value).arrayBuffer();
      } else if (typeof value === 'string') {
        const encoded = new TextEncoder().encode(value);
        const newBuffer = new ArrayBuffer(encoded.length);
        new Uint8Array(newBuffer).set(encoded);
        buffer = newBuffer;
      } else if (value instanceof Blob) {
        buffer = await value.arrayBuffer();
      } else if (value === null) {
        buffer = new ArrayBuffer(0);
      } else {
        // ArrayBufferView - convert to ArrayBuffer
        const view = value as ArrayBufferView;
        const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        // Create a new ArrayBuffer from the view
        const newBuffer = new ArrayBuffer(arr.length);
        new Uint8Array(newBuffer).set(arr);
        buffer = newBuffer;
      }
      
      files.set(key, buffer);
      return createR2Object(key, buffer);
    },
    delete: async (keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => files.delete(key));
      return;
    },
    list: async (options?: R2ListOptions) => {
      const results: R2Object[] = [];
      const prefix = options?.prefix || '';
      
      for (const [key, data] of files.entries()) {
        if (key.startsWith(prefix)) {
          results.push(createR2Object(key, data));
        }
      }
      
      return {
        objects: results,
        truncated: false,
        cursor: '',
        delimitedPrefixes: [],
      };
    },
    createMultipartUpload: async () => {
      return {
        key: '',
        uploadId: '',
        uploadPart: async () => ({ partNumber: 1, etag: '' }),
        abort: async () => {},
        complete: async () => createR2Object('', new ArrayBuffer(0)),
      } as R2MultipartUpload;
    },
    resumeMultipartUpload: (uploadId: string) => {
      return {
        key: '',
        uploadId,
        uploadPart: async () => ({ partNumber: 1, etag: '' }),
        abort: async () => {},
        complete: async () => createR2Object('', new ArrayBuffer(0)),
      } as R2MultipartUpload;
    },
  } as R2Bucket;
}