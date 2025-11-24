import type { Media } from '@/db/schema';
import { R2_BUCKET_NAME, R2_PUBLIC_URL } from '@/lib/storage/r2-client';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;

function buildBaseUrl(fileKey: string): string {
  // Prefer explicitly configured public base URL if available
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${fileKey}`;
  }

  // Fallback to direct R2 URL structure. This might not be public depending on bucket settings,
  // but it provides a stable shape for callers and can be proxied via CDN if needed.
  if (R2_ACCOUNT_ID) {
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileKey}`;
  }

  // If env is misconfigured, surface an obviously broken URL rather than crashing callers.
  return `/media/${fileKey}`;
}

export function getMediaVariantUrls(media: Media) {
  const baseUrl = buildBaseUrl(media.fileKey);

  return {
    url: baseUrl,
    // These variant URLs assume either Cloudflare Images or a transformation layer
    // configured to respond to the `variant` query parameter.
    thumbnailUrl: `${baseUrl}?variant=thumbnail`,
    largeUrl: `${baseUrl}?variant=large`,
  };
}


