import type { Media } from '@/db/schema';
import { getR2BucketName, getR2PublicUrl } from '@/lib/storage/r2-client';

function buildBaseUrl(
  fileKey: string,
  env: {
    R2_ACCOUNT_ID?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_URL?: string;
  }
): string {
  const publicUrl = getR2PublicUrl(env);
  const bucketName = getR2BucketName(env);
  
  // Prefer explicitly configured public base URL if available
  if (publicUrl) {
    return `${publicUrl}/${fileKey}`;
  }

  // Fallback to direct R2 URL structure. This might not be public depending on bucket settings,
  // but it provides a stable shape for callers and can be proxied via CDN if needed.
  if (env.R2_ACCOUNT_ID) {
    return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${fileKey}`;
  }

  // If env is misconfigured, surface an obviously broken URL rather than crashing callers.
  return `/media/${fileKey}`;
}

export function getMediaVariantUrls(
  media: Media,
  env?: {
    R2_ACCOUNT_ID?: string;
    R2_BUCKET_NAME?: string;
    R2_PUBLIC_URL?: string;
  }
) {
  const baseUrl = buildBaseUrl(media.fileKey, env || {});

  return {
    url: baseUrl,
    // These variant URLs assume either Cloudflare Images or a transformation layer
    // configured to respond to the `variant` query parameter.
    thumbnailUrl: `${baseUrl}?variant=thumbnail`,
    largeUrl: `${baseUrl}?variant=large`,
  };
}


