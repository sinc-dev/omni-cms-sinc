import type { Media } from '@/db/schema';
import { getR2BucketName, getR2PublicUrl } from '@/lib/storage/r2-client';

function buildBaseUrl(
  fileKey: string,
  env: {
    APP_URL?: string;
    R2_ACCOUNT_ID?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_URL?: string;
  }
): string {
  // Prefer Workers route URL using APP_URL (recommended approach)
  // This keeps R2 bucket private and allows proper caching headers
  if (env.APP_URL) {
    return `${env.APP_URL}/api/public/v1/media/${fileKey}`;
  }

  // Fallback to explicitly configured public URL if available
  const publicUrl = getR2PublicUrl(env);
  if (publicUrl) {
    return `${publicUrl}/${fileKey}`;
  }

  // Fallback to direct R2 URL structure (may not work if bucket is private)
  // This provides a stable shape for callers but may require public bucket access
  const bucketName = getR2BucketName(env);
  if (env.R2_ACCOUNT_ID) {
    return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${fileKey}`;
  }

  // If env is misconfigured, surface an obviously broken URL rather than crashing callers.
  return `/api/public/v1/media/${fileKey}`;
}

export function getMediaVariantUrls(
  media: Media,
  env?: {
    APP_URL?: string;
    R2_ACCOUNT_ID?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_URL?: string;
  }
) {
  const baseUrl = buildBaseUrl(media.fileKey, env || {});

  return {
    url: baseUrl,
    // Variant URLs use query parameters that the Workers route can handle
    // Currently returns original file, but transformation logic can be added later
    thumbnailUrl: `${baseUrl}?variant=thumbnail`,
    largeUrl: `${baseUrl}?variant=large`,
  };
}


