// Cloudflare bindings type definition
export interface CloudflareBindings {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  // Environment variables and secrets configured in Cloudflare Workers
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET_NAME?: string;
  R2_PUBLIC_URL?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  OPENAI_API_KEY?: string;
  APP_URL?: string;
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

