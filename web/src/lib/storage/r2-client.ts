import { S3Client } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  // We don't throw here to allow build time execution, but it will fail at runtime if used
  console.warn('Missing R2 environment variables. Media upload will not work.');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'omni-cms-media';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional: for public access if configured
