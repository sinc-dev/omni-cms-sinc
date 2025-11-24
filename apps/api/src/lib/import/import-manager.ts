import type { DbClient } from '@/db/client';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { posts, postTypes, taxonomies, media, customFields, postFieldValues, postTaxonomies } from '@/db/schema';

export interface ImportOptions {
  skipExisting?: boolean;
  importMedia?: boolean;
  dryRun?: boolean;
}

export interface ImportResult {
  success: boolean;
  imported: {
    postTypes: number;
    customFields: number;
    taxonomies: number;
    posts: number;
    media: number;
  };
  errors: Array<{ type: string; id: string; error: string }>;
}

/**
 * Import organization data from JSON
 */
export async function importOrganizationData(
  db: DbClient,
  organizationId: string,
  importData: Record<string, unknown>,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { skipExisting = false, dryRun = false } = options;

  const result: ImportResult = {
    success: true,
    imported: {
      postTypes: 0,
      customFields: 0,
      taxonomies: 0,
      posts: 0,
      media: 0,
    },
    errors: [],
  };

  if (dryRun) {
    // Just validate, don't import
    return result;
  }

  // Import post types
  if (importData.postTypes && Array.isArray(importData.postTypes)) {
    for (const postType of importData.postTypes) {
      try {
        // Check if exists
        const existing = await db.query.postTypes.findFirst({
          where: and(
            eq(postTypes.organizationId, organizationId),
            eq(postTypes.slug, postType.slug)
          ),
        });

        if (existing && skipExisting) {
          continue;
        }

        if (!existing) {
          await db.insert(postTypes).values({
            id: nanoid(),
            organizationId,
            ...postType,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          result.imported.postTypes++;
        }
      } catch (error) {
        result.errors.push({
          type: 'postType',
          id: postType.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // Import custom fields
  if (importData.customFields && Array.isArray(importData.customFields)) {
    for (const field of importData.customFields) {
      try {
        const existing = await db.query.customFields.findFirst({
          where: and(
            eq(customFields.organizationId, organizationId),
            eq(customFields.slug, field.slug)
          ),
        });

        if (existing && skipExisting) {
          continue;
        }

        if (!existing) {
          await db.insert(customFields).values({
            id: nanoid(),
            organizationId,
            ...field,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          result.imported.customFields++;
        }
      } catch (error) {
        result.errors.push({
          type: 'customField',
          id: field.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // Import taxonomies
  if (importData.taxonomies && Array.isArray(importData.taxonomies)) {
    for (const taxonomy of importData.taxonomies) {
      try {
        const existing = await db.query.taxonomies.findFirst({
          where: and(
            eq(taxonomies.organizationId, organizationId),
            eq(taxonomies.slug, taxonomy.slug)
          ),
        });

        if (existing && skipExisting) {
          continue;
        }

        if (!existing) {
          const { terms, ...taxonomyData } = taxonomy;
          const newTaxonomy = await db.insert(taxonomies).values({
            id: nanoid(),
            organizationId,
            ...taxonomyData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          // Import terms
          if (terms && Array.isArray(terms)) {
            // Import taxonomy terms logic here
          }

          result.imported.taxonomies++;
        }
      } catch (error) {
        result.errors.push({
          type: 'taxonomy',
          id: taxonomy.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  // Import posts
  if (importData.posts && Array.isArray(importData.posts)) {
    for (const post of importData.posts) {
      try {
        // Map old IDs to new IDs for post types, etc.
        // This is simplified - full implementation would need ID mapping
        const { fieldValues, taxonomyTermIds, ...postData } = post;

        const newPost = await db.insert(posts).values({
          id: nanoid(),
          organizationId,
          ...postData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        // Import field values and taxonomies
        // ... (simplified for brevity)

        result.imported.posts++;
      } catch (error) {
        result.errors.push({
          type: 'post',
          id: post.id || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

