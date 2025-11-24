import { Hono } from 'hono';
import type { CloudflareBindings } from '../../types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Variant configuration
const VARIANT_CONFIG: Record<string, { suffix: string; maxWidth?: number; maxHeight?: number }> = {
  thumbnail: { suffix: '_thumbnail', maxWidth: 300, maxHeight: 300 },
  large: { suffix: '_large', maxWidth: 1920, maxHeight: 1920 },
};

// Helper to infer content type from file extension
function getContentType(fileKey: string, defaultMimeType?: string): string {
  if (defaultMimeType) {
    return defaultMimeType;
  }

  const extension = fileKey.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Generate variant file key from base fileKey
 * Example: "abc123.jpg" + "_thumbnail" -> "abc123_thumbnail.jpg"
 */
function getVariantFileKey(fileKey: string, variant: string): string {
  const config = VARIANT_CONFIG[variant];
  if (!config) {
    return fileKey; // Return original if variant not configured
  }

  const lastDotIndex = fileKey.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${fileKey}${config.suffix}`;
  }

  const baseName = fileKey.substring(0, lastDotIndex);
  const extension = fileKey.substring(lastDotIndex);
  return `${baseName}${config.suffix}${extension}`;
}

/**
 * Check if file is an image that supports variants
 */
function isImageFile(fileKey: string, contentType?: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (contentType && imageMimeTypes.includes(contentType.toLowerCase())) {
    return true;
  }

  const extension = fileKey.toLowerCase();
  return imageExtensions.some(ext => extension.endsWith(ext));
}

/**
 * Fetch file from R2
 * Note: Cloudflare's edge cache will handle caching automatically based on Cache-Control headers
 */
async function fetchFromR2(
  bucket: R2Bucket,
  fileKey: string
): Promise<R2ObjectBody | null> {
  return await bucket.get(fileKey);
}

// GET /api/public/v1/media/:fileKey - Serve media file from R2
app.get('/media/:fileKey', async (c) => {
  let fileKey = c.req.param('fileKey');
  const variant = c.req.query('variant'); // thumbnail, large, etc.

  if (!fileKey) {
    return c.json({ error: 'File key required' }, 400);
  }

  // Decode URL-encoded fileKey (Hono should handle this, but be explicit)
  try {
    fileKey = decodeURIComponent(fileKey);
  } catch {
    // If decoding fails, use original fileKey
  }

  // Get R2 bucket binding
  const bucket = c.env.R2_BUCKET;
  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500);
  }

  try {
    // Determine which file to fetch (variant or original)
    let targetFileKey = fileKey;
    let useVariant = false;

    if (variant && VARIANT_CONFIG[variant]) {
      const variantFileKey = getVariantFileKey(fileKey, variant);
      // Try to fetch variant file first
      const variantObject = await bucket.head(variantFileKey);
      if (variantObject) {
        targetFileKey = variantFileKey;
        useVariant = true;
      } else {
        // Variant doesn't exist, check if original is an image
        // If it's an image, we'll serve the original (variants can be generated later)
        // If it's not an image, variants don't make sense
        const originalObject = await bucket.head(fileKey);
        if (originalObject) {
          const contentType = getContentType(fileKey, originalObject.httpMetadata?.contentType);
          if (!isImageFile(fileKey, contentType)) {
            // Not an image, variants don't apply
            return c.json({ error: 'Variants are only supported for images' }, 400);
          }
        }
      }
    }

    // Fetch file from R2
    const object = await fetchFromR2(bucket, targetFileKey);

    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get content type from object metadata or infer from fileKey
    const contentType = getContentType(targetFileKey, object.httpMetadata?.contentType);

    // Prepare headers with aggressive caching
    // Cloudflare's edge cache will automatically cache based on these headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      // Long-term caching: 1 year (31536000 seconds) with immutable flag
      // This tells Cloudflare and browsers to cache aggressively
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    // Add ETag if available (for cache validation and conditional requests)
    if (object.httpEtag) {
      headers['ETag'] = object.httpEtag;
      
      // Check if client has cached version (304 Not Modified)
      const ifNoneMatch = c.req.header('If-None-Match');
      if (ifNoneMatch === object.httpEtag) {
        return c.body(null, 304, headers);
      }
    }

    // Add Last-Modified if available (for cache validation)
    if (object.uploaded) {
      headers['Last-Modified'] = new Date(object.uploaded).toUTCString();
      
      // Check if client has cached version (304 Not Modified)
      const ifModifiedSince = c.req.header('If-Modified-Since');
      if (ifModifiedSince) {
        try {
          const modifiedSince = new Date(ifModifiedSince);
          const uploaded = new Date(object.uploaded);
          if (uploaded <= modifiedSince) {
            return c.body(null, 304, headers);
          }
        } catch {
          // Invalid date, ignore
        }
      }
    }

    // Add content length if available
    if (object.size) {
      headers['Content-Length'] = object.size.toString();
    }

    // Add Vary header if serving variants (helps with cache key generation)
    if (useVariant) {
      headers['Vary'] = 'Accept';
    }

    // Stream the file content
    // Cloudflare Workers will automatically cache this response based on Cache-Control headers
    return c.body(object.body, 200, headers);
  } catch (error) {
    console.error('Error serving media file:', error);
    return c.json(
      { error: 'Failed to serve media file', message: error instanceof Error ? error.message : 'Unknown error' },
      500
    );
  }
});

export default app;

