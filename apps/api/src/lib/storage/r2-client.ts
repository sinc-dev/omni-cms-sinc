// Lazy initialization to prevent AWS SDK from being bundled into every route
// The client is only created when actually needed (on first use)

import type { S3Client } from '@aws-sdk/client-s3';
import type { R2Bucket } from '@cloudflare/workers-types';

// Cache clients per environment configuration
const clientCache = new Map<string, S3Client>();

/**
 * Gets or creates the R2 S3 client instance (lazy initialization)
 * This prevents AWS SDK from being bundled into routes that don't use it
 * 
 * Note: Presigned URLs require AWS credentials. Even if R2_BUCKET binding exists,
 * you still need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY for presigned URLs.
 * 
 * @param env Environment variables from Cloudflare Workers (c.env)
 */
export async function getR2Client(env: {
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: R2Bucket; // Binding (optional, but useful for direct operations)
}): Promise<S3Client> {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
  
  // Check if credentials are provided (required for presigned URLs)
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    // If binding exists, provide helpful error message
    if (R2_BUCKET) {
      throw new Error(
        'R2 bucket binding exists, but R2 credentials are still required for presigned URLs. ' +
        'Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables ' +
        'in your Cloudflare Workers settings.'
      );
    }
    throw new Error(
      'Missing R2 environment variables. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required. ' +
      'Alternatively, bind R2_BUCKET and set the credentials for presigned URL generation.'
    );
  }

  // Create cache key from env vars
  const cacheKey = `${R2_ACCOUNT_ID}:${R2_ACCESS_KEY_ID}`;
  
  if (!clientCache.has(cacheKey)) {
    // Dynamic import - only loads AWS SDK when this function is called
    const { S3Client } = await import('@aws-sdk/client-s3');
    
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    
    clientCache.set(cacheKey, client);
  }
  
  return clientCache.get(cacheKey)!;
}

/**
 * Gets R2 bucket name from environment or defaults to 'omni-cms-media'
 */
export function getR2BucketName(env: { R2_BUCKET_NAME?: string }): string {
  return env.R2_BUCKET_NAME || 'omni-cms-media';
}

/**
 * Gets R2 public URL from environment (optional)
 */
export function getR2PublicUrl(env: { R2_PUBLIC_URL?: string }): string | undefined {
  return env.R2_PUBLIC_URL;
}
