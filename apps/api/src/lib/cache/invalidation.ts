// Cache invalidation utilities for Cloudflare Pages/CDN
// This handles cache purging when content is updated

import type { DbClient } from '@/db/client';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Helper function to get organization slug from ID
 */
async function getOrganizationSlug(db: DbClient, organizationId: string): Promise<string | null> {
  const org = await db.query.organizations.findFirst({
    where: (o, { eq }) => eq(o.id, organizationId),
    columns: { slug: true },
  });
  return org?.slug || null;
}

/**
 * Helper function to normalize organization identifier (ID or slug)
 * Returns slug if ID is provided, otherwise returns as-is
 */
async function normalizeOrganizationIdentifier(
  db: DbClient | null,
  organizationIdOrSlug: string
): Promise<string> {
  // If db is provided and the identifier looks like an ID (UUID format), try to look it up
  if (db && organizationIdOrSlug.length > 20) {
    // Likely an ID, try to get slug
    const slug = await getOrganizationSlug(db, organizationIdOrSlug);
    if (slug) {
      return slug;
    }
  }
  // Return as-is (assume it's already a slug)
  return organizationIdOrSlug;
}

/**
 * Invalidates cache for public API endpoints related to an organization
 * @param organizationId - The organization ID
 * @param organizationSlug - The organization slug (for public API)
 */
export async function invalidateOrganizationCache(
  organizationId: string,
  organizationSlug: string
): Promise<void> {
  // Build list of cache keys to invalidate
  const cachePaths = [
    `/api/public/v1/${organizationSlug}/posts`,
    `/api/public/v1/${organizationSlug}/taxonomies/*`,
  ];

  // In a production environment with Cloudflare Workers/Pages,
  // you would use Cloudflare's Cache API here
  // For now, this is a placeholder that can be extended

  // If running in Cloudflare Pages environment, use Cache API
  if (typeof caches !== 'undefined') {
    for (const path of cachePaths) {
      try {
        // Delete all cached responses matching this path pattern
        // Note: Cloudflare Cache API doesn't support wildcards directly
        // We'd need to track specific cache keys or use tags
        const cache = await caches.open('public-api');
        // Cache invalidation would happen here
        // For now, we rely on Cache-Control headers and revalidation
      } catch (error) {
        console.error(`Failed to invalidate cache for ${path}:`, error);
        // Don't throw - cache invalidation failure shouldn't break updates
      }
    }
  }
}

/**
 * Invalidates cache for a specific post
 * @param organizationIdOrSlug - The organization ID or slug
 * @param postIdOrSlug - The post ID or slug
 * @param db - Optional database client to look up organization slug from ID
 */
export async function invalidatePostCache(
  organizationIdOrSlug: string,
  postIdOrSlug: string,
  db?: DbClient | null
): Promise<void> {
  // Look up organization slug from ID if database is provided
  const orgSlug = db
    ? await normalizeOrganizationIdentifier(db, organizationIdOrSlug)
    : organizationIdOrSlug;
  
  const cachePaths = [
    `/api/public/v1/${orgSlug}/posts/${postIdOrSlug}`,
    `/api/public/v1/${orgSlug}/posts`, // Also invalidate list
  ];

  if (typeof caches !== 'undefined') {
    for (const path of cachePaths) {
      try {
        const cache = await caches.open('public-api');
        // Invalidate specific cache keys
        // Implementation would depend on how cache keys are structured
      } catch (error) {
        console.error(`Failed to invalidate cache for ${path}:`, error);
      }
    }
  }
}

/**
 * Invalidates cache for taxonomy-related endpoints
 * @param organizationIdOrSlug - The organization ID or slug
 * @param taxonomySlug - The taxonomy slug (optional)
 * @param termSlug - The term slug (optional)
 * @param db - Optional database client to look up organization slug from ID
 */
export async function invalidateTaxonomyCache(
  organizationIdOrSlug: string,
  taxonomySlug?: string,
  termSlug?: string,
  db?: DbClient | null
): Promise<void> {
  // Look up organization slug from ID if database is provided
  const orgSlug = db
    ? await normalizeOrganizationIdentifier(db, organizationIdOrSlug)
    : organizationIdOrSlug;
  
  const cachePaths: string[] = [];

  if (termSlug && taxonomySlug) {
    // Invalidate posts by term
    cachePaths.push(
      `/api/public/v1/${orgSlug}/taxonomies/${taxonomySlug}/${termSlug}/posts`
    );
    cachePaths.push(`/api/public/v1/${orgSlug}/posts`); // Also invalidate main list
  }

  if (taxonomySlug) {
    // Invalidate taxonomy detail
    cachePaths.push(
      `/api/public/v1/${orgSlug}/taxonomies/${taxonomySlug}`
    );
  }

  // Always invalidate main posts list as taxonomies affect post filtering
  cachePaths.push(`/api/public/v1/${orgSlug}/posts`);

  if (typeof caches !== 'undefined') {
    for (const path of cachePaths) {
      try {
        const cache = await caches.open('public-api');
        // Invalidate cache
      } catch (error) {
        console.error(`Failed to invalidate cache for ${path}:`, error);
      }
    }
  }
}

/**
 * Helper to trigger cache revalidation via revalidatePath (Next.js)
 * This is the recommended approach for Next.js on Cloudflare Pages
 * @param path - The path to revalidate
 */
export async function revalidatePublicPath(path: string): Promise<void> {
  try {
    // In Next.js App Router, we can use revalidatePath
    // However, in API routes we typically can't use Next.js revalidation
    // Instead, we rely on Cache-Control headers and manual cache purging
    
    // For Cloudflare Pages, the cache will be revalidated based on
    // Cache-Control headers (stale-while-revalidate)
    // This function serves as a placeholder for future Cloudflare API integration
    
    // If you have Cloudflare API credentials, you could call:
    // await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    //   body: JSON.stringify({ files: [path] })
    // });
  } catch (error) {
    console.error(`Failed to revalidate path ${path}:`, error);
  }
}

