import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postVersions, postFieldValues } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// POST /api/admin/v1/organizations/:orgId/posts/:postId/versions/:versionId/restore
// Restore a version (creates a new version with restored content)
app.post(
  '/:orgId/posts/:postId/versions/:versionId/restore',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, user, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');
    const versionId = c.req.param('versionId');

    // Verify post exists and belongs to organization
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, postId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!post) {
      return c.json(Errors.notFound('Post'), 404);
    }

    // Get version to restore
    const version = await db.query.postVersions.findFirst({
      where: (pv, { eq, and: andFn }) => andFn(
        eq(pv.id, versionId),
        eq(pv.postId, postId)
      ),
    });

    if (!version) {
      return c.json(Errors.notFound('Version'), 404);
    }

    // Get next version number
    const maxVersionResult = await db
      .select({ maxVersion: sql<number>`max(${postVersions.versionNumber})` })
      .from(postVersions)
      .where(eq(postVersions.postId, postId));

    const nextVersionNumber = (maxVersionResult[0]?.maxVersion || 0) + 1;

    // Get current custom fields before restore
    const currentFieldValues = await db.query.postFieldValues.findMany({
      where: (pfv, { eq }) => eq(pfv.postId, postId),
    });

    const currentCustomFields: Record<string, unknown> = {};
    for (const fv of currentFieldValues) {
      try {
        currentCustomFields[fv.customFieldId] = JSON.parse(fv.value || 'null');
      } catch {
        currentCustomFields[fv.customFieldId] = fv.value;
      }
    }

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
        customFields: JSON.stringify(currentCustomFields),
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

    return c.json(successResponse({
      message: 'Version restored',
      restoredVersion: version,
      backupVersion: currentVersion[0],
    }));
  }
);

export default app;

