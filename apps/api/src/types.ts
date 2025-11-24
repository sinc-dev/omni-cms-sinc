// Cloudflare bindings type definition
export interface CloudflareBindings {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

// Hono context variables
export interface HonoVariables {
  user: import('./db/schema').User | null; // null when using API key auth
  db: ReturnType<typeof import('./db/client').getDb>;
  organizationId?: string;
  apiKey?: {
    id: string;
    organizationId: string;
    scopes: string[];
  };
  authMethod?: 'cloudflare-access' | 'api-key';
}

