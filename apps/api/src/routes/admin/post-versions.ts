import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postVersions, users } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/posts/:postId/versions
// List all versions for a post
app.get(
  '/:orgId/posts/:postId/versions',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');

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

    // Get all versions
    const versionsData = await db.query.postVersions.findMany({
      where: (pv, { eq }) => eq(pv.postId, postId),
      orderBy: [desc(postVersions.versionNumber)],
    });
    
    // Get creator info for each version
    const versions = await Promise.all(
      versionsData.map(async (v) => {
        const creator = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, v.createdBy),
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        });
        return {
          ...v,
          creator: creator || null,
        };
      })
    );

    return c.json(successResponse(versions));
  }
);

// GET /api/admin/v1/organizations/:orgId/posts/:postId/versions/:versionId
// Get a specific version
app.get(
  '/:orgId/posts/:postId/versions/:versionId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postId = c.req.param('postId');
    const versionId = c.req.param('versionId');

    if (!postId || !versionId) {
      return c.json(Errors.badRequest('Post ID and Version ID required'), 400);
    }

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

    // Get version
    const versionData = await db.query.postVersions.findFirst({
      where: (pv, { eq, and: andFn }) => andFn(
        eq(pv.id, versionId),
        eq(pv.postId, postId)
      ),
    });
    
    if (!versionData) {
      return c.json(Errors.notFound('Version'), 404);
    }
    
    // Get creator info
    const creator = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, versionData.createdBy),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });
    
    const version = {
      ...versionData,
      creator: creator || null,
    };

    return c.json(successResponse(version));
  }
);

export default app;

