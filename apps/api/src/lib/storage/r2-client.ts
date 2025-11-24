// Lazy initialization to prevent AWS SDK from being bundled into every route
// The client is only created when actually needed (on first use)

import type { S3Client } from '@aws-sdk/client-s3';

let r2ClientInstance: S3Client | null = null;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  // We don't throw here to allow build time execution, but it will fail at runtime if used
  console.warn('Missing R2 environment variables. Media upload will not work.');
}

/**
 * Gets or creates the R2 S3 client instance (lazy initialization)
 * This prevents AWS SDK from being bundled into routes that don't use it
 */
export async function getR2Client(): Promise<S3Client> {
  if (!r2ClientInstance) {
    // Dynamic import - only loads AWS SDK when this function is called
    const { S3Client } = await import('@aws-sdk/client-s3');
    
    r2ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return r2ClientInstance;
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'omni-cms-media';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: for public access if configured
