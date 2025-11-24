import type { DbClient } from '@/db/client';
import { eq, and, inArray } from 'drizzle-orm';
import { posts, postTypes, taxonomies, media, customFields, postFieldValues } from '@/db/schema';
import { postTaxonomies } from '@/db/schema/taxonomies';

export interface ExportOptions {
  includePosts?: boolean;
  includeMedia?: boolean;
  includeTaxonomies?: boolean;
  includeCustomFields?: boolean;
  postTypeIds?: string[];
}

/**
 * Export organization data as JSON
 */
export async function exportOrganizationData(
  db: DbClient,
  organizationId: string,
  options: ExportOptions = {}
) {
  const {
    includePosts = true,
    includeMedia = true,
    includeTaxonomies = true,
    includeCustomFields = true,
    postTypeIds,
  } = options;

  const exportData: Record<string, unknown> = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    organizationId,
  };

  // Export post types
  const postTypesData = await db.query.postTypes.findMany({
    where: eq(postTypes.organizationId, organizationId),
  });
  exportData.postTypes = postTypesData;

  // Export custom fields
  if (includeCustomFields) {
    const customFieldsData = await db.query.customFields.findMany({
      where: eq(customFields.organizationId, organizationId),
    });
    exportData.customFields = customFieldsData;
  }

  // Export taxonomies
  if (includeTaxonomies) {
    const taxonomiesData = await db.query.taxonomies.findMany({
      where: eq(taxonomies.organizationId, organizationId),
      with: {
        terms: true,
      },
    });
    exportData.taxonomies = taxonomiesData;
  }

  // Export posts
  if (includePosts) {
    const postsData = await db.query.posts.findMany({
      where: postTypeIds && postTypeIds.length > 0
        ? and(
            eq(posts.organizationId, organizationId),
            inArray(posts.postTypeId, postTypeIds)
          )
        : eq(posts.organizationId, organizationId),
      with: {
        fieldValues: true,
      },
    });

    // Get taxonomy associations
    const postsWithTaxonomies = await Promise.all(
      postsData.map(async (post) => {
        const postTaxonomiesData = await db.query.postTaxonomies.findMany({
          where: eq(postTaxonomies.postId, post.id),
        });
        return {
          ...post,
          taxonomyTermIds: postTaxonomiesData.map((pt) => pt.taxonomyTermId),
        };
      })
    );

    exportData.posts = postsWithTaxonomies;
  }

  // Export media metadata (not files themselves)
  if (includeMedia) {
    const mediaData = await db.query.media.findMany({
      where: eq(media.organizationId, organizationId),
    });
    exportData.media = mediaData.map((m) => ({
      ...m,
      // Note: File URLs would need to be included for import
      fileUrl: null, // Would need to generate signed URL
    }));
  }

  return exportData;
}

/**
 * Generate export file and return as JSON string
 */
export async function generateExportFile(
  db: DbClient,
  organizationId: string,
  options: ExportOptions = {}
): Promise<string> {
  const data = await exportOrganizationData(db, organizationId, options);
  return JSON.stringify(data, null, 2);
}

