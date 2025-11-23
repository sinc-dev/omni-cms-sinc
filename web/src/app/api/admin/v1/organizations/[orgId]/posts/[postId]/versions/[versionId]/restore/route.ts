import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { withAuth } from '@/lib/api/auth-wrapper';
import { successResponse, Errors } from '@/lib/api/response';
import { posts } from '@/db/schema/posts';
import { postVersions } from '@/db/schema/post-versions';
import { postFieldValues } from '@/db/schema/posts';
import { sql } from 'drizzle-orm';

// POST /api/admin/v1/organizations/:orgId/posts/:postId/versions/:versionId/restore
// Restore a version (creates a new version with restored content)
export const POST = withAuth(
  async (request, { db, user, organizationId }, params) => {
    const postId = params?.postId;
    const versionId = params?.versionId;
    if (!postId || !versionId) return Errors.badRequest('Post ID and Version ID required');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: and(
        eq(posts.id, postId),
        eq(posts.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return Errors.notFound('Post');
    }

    // Get version to restore
    const version = await db.select().from(postVersions).where(
      and(
        eq(postVersions.id, versionId),
        eq(postVersions.postId, postId)
      )
    ).limit(1).then(rows => rows[0] || null);

    if (!version) {
      return Errors.notFound('Version');
    }

    // Get next version number
    const maxVersionResult = await db
      .select({ maxVersion: sql<number>`max(${postVersions.versionNumber})` })
      .from(postVersions)
      .where(eq(postVersions.postId, postId));

    const nextVersionNumber = (maxVersionResult[0]?.maxVersion || 0) + 1;

    // Create new version from current post state (before restore)
    const currentVersion = await db
      .insert(postVersions)
      .values({
        id: nanoid(),
        postId,
        versionNumber: nextVersionNumber,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        customFields: JSON.stringify({}), // Would need to fetch current custom fields
        createdBy: user.id,
        createdAt: new Date(),
      })
      .returning();

    // Restore post content from version
    const customFieldsData = version.customFields
      ? JSON.parse(version.customFields)
      : {};

    await db
      .update(posts)
      .set({
        title: version.title,
        slug: version.slug,
        content: version.content,
        excerpt: version.excerpt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // Restore custom fields
    if (Object.keys(customFieldsData).length > 0) {
      // Delete existing custom field values
      await db
        .delete(postFieldValues)
        .where(eq(postFieldValues.postId, postId));

      // Insert restored custom field values
      const fieldValues = Object.entries(customFieldsData).map(([fieldId, value]) => ({
        id: nanoid(),
        postId,
        customFieldId: fieldId,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (fieldValues.length > 0) {
        await db.insert(postFieldValues).values(fieldValues);
      }
    }

    return successResponse({
      message: 'Version restored',
      restoredVersion: version,
      backupVersion: currentVersion[0],
    });
  },
  {
    requiredPermission: 'posts:update',
    requireOrgAccess: true,
  }
);

