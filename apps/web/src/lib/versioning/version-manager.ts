import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts, postVersions, postFieldValues } from '@/db/schema';
import type { DbClient } from '@/db/client';

interface CreateVersionOptions {
  postId: string;
  userId: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  customFields?: Record<string, unknown>;
}

/**
 * Create a new version of a post
 * Automatically increments version number
 */
export async function createPostVersion(
  db: DbClient,
  options: CreateVersionOptions
) {
  const { postId, userId, title, slug, content, excerpt, customFields } = options;

  // Get current max version number
  const maxVersionResult = await db
    .select({ maxVersion: sql<number>`max(${postVersions.versionNumber})` })
    .from(postVersions)
    .where(eq(postVersions.postId, postId));

  const nextVersionNumber = (maxVersionResult[0]?.maxVersion || 0) + 1;

  // Get current custom field values
  let customFieldsJson = '{}';
  if (customFields) {
    customFieldsJson = JSON.stringify(customFields);
  } else {
    // Fetch current custom fields from database
    const currentFields = await db.query.postFieldValues.findMany({
      where: eq(postFieldValues.postId, postId),
    });

    const fieldsObj: Record<string, unknown> = {};
    for (const field of currentFields) {
      try {
        fieldsObj[field.customFieldId] = JSON.parse(field.value || 'null');
      } catch {
        fieldsObj[field.customFieldId] = field.value;
      }
    }
    customFieldsJson = JSON.stringify(fieldsObj);
  }

  // Create version
  const version = await db
    .insert(postVersions)
    .values({
      id: nanoid(),
      postId,
      versionNumber: nextVersionNumber,
      title,
      slug,
      content,
      excerpt,
      customFields: customFieldsJson,
      createdBy: userId,
      createdAt: new Date(),
    })
    .returning();

  return version[0];
}

/**
 * Get version limit per post (configurable, default 50)
 */
const VERSION_LIMIT = 50;

/**
 * Clean up old versions, keeping only the most recent N versions
 */
export async function cleanupOldVersions(
  db: DbClient,
  postId: string,
  limit: number = VERSION_LIMIT
) {
  // Get all versions ordered by version number descending
  const allVersions = await db.query.postVersions.findMany({
    where: eq(postVersions.postId, postId),
    orderBy: (versions, { desc }) => [desc(versions.versionNumber)],
  });

  // If we have more than the limit, delete the oldest ones
  if (allVersions.length > limit) {
    const versionsToDelete = allVersions.slice(limit);
    const idsToDelete = versionsToDelete.map((v) => v.id);

    for (const id of idsToDelete) {
      await db.delete(postVersions).where(eq(postVersions.id, id));
    }

    return idsToDelete.length;
  }

  return 0;
}

