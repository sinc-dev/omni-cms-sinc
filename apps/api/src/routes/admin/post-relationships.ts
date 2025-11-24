import { Hono } from 'hono';
import { eq, and, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postRelationships } from '../../db/schema';
import { z } from 'zod';

const app = new Hono<{ Bindings: CloudflareBindings }>();

const createRelationshipSchema = z.object({
  toPostId: z.string().min(1),
  relationshipType: z.string().min(1),
});

// GET /api/admin/v1/organizations/:orgId/posts/:postId/relationships
app.get(
  '/:orgId/posts/:postId/relationships',
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

    // Get all relationships for this post (both from and to)
    const relationshipsFrom = await db.query.postRelationships.findMany({
      where: (pr, { eq }) => eq(pr.fromPostId, postId),
    });

    const relationshipsTo = await db.query.postRelationships.findMany({
      where: (pr, { eq }) => eq(pr.toPostId, postId),
    });

    // Fetch related posts
    const toPostIds = relationshipsFrom.map((r) => r.toPostId);
    const fromPostIds = relationshipsTo.map((r) => r.fromPostId);
    const allRelatedPostIds = [...new Set([...toPostIds, ...fromPostIds])];

    const relatedPosts = allRelatedPostIds.length > 0
      ? await db.query.posts.findMany({
          where: (p, { eq, and: andFn, inArray }) => andFn(
            inArray(p.id, allRelatedPostIds),
            eq(p.organizationId, organizationId!)
          ),
          columns: {
            id: true,
            title: true,
            slug: true,
            status: true,
            postTypeId: true,
          },
          with: {
            postType: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })
      : [];

    const postsMap = new Map(relatedPosts.map((p) => [p.id, p]));

    // Format relationships
    const formattedRelationships = [
      ...relationshipsFrom.map((rel) => ({
        id: rel.id,
        fromPostId: rel.fromPostId,
        toPostId: rel.toPostId,
        relationshipType: rel.relationshipType,
        relatedPost: postsMap.get(rel.toPostId) || null,
        direction: 'outgoing' as const,
        createdAt: rel.createdAt,
      })),
      ...relationshipsTo.map((rel) => ({
        id: rel.id,
        fromPostId: rel.fromPostId,
        toPostId: rel.toPostId,
        relationshipType: rel.relationshipType,
        relatedPost: postsMap.get(rel.fromPostId) || null,
        direction: 'incoming' as const,
        createdAt: rel.createdAt,
      })),
    ];

    return c.json(successResponse(formattedRelationships));
  }
);

// POST /api/admin/v1/organizations/:orgId/posts/:fromPostId/relationships
app.post(
  '/:orgId/posts/:fromPostId/relationships',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const fromPostId = c.req.param('fromPostId');

    let body;
    try {
      body = await c.req.json();
      createRelationshipSchema.parse(body);
    } catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        return c.json(Errors.validationError((error as any).issues), 400);
      }
      return c.json(Errors.badRequest('Invalid request body'), 400);
    }

    const { toPostId, relationshipType } = body;

    // Verify both posts exist and belong to organization
    const fromPost = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, fromPostId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!fromPost) {
      return c.json(Errors.notFound('Source post'), 404);
    }

    const toPost = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, toPostId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!toPost) {
      return c.json(Errors.notFound('Target post'), 404);
    }

    // Check if relationship already exists
    const existing = await db.query.postRelationships.findFirst({
      where: (pr, { eq, and: andFn }) => andFn(
        eq(pr.fromPostId, fromPostId!),
        eq(pr.toPostId, toPostId),
        eq(pr.relationshipType, relationshipType)
      ),
    });

    if (existing) {
      return c.json(Errors.badRequest('Relationship already exists'), 400);
    }

    // Create relationship
    const newRelationship = await db
      .insert(postRelationships)
      .values({
        id: nanoid(),
        fromPostId: fromPostId!,
        toPostId,
        relationshipType,
        createdAt: new Date(),
      })
      .returning();

    const relationshipArray = Array.isArray(newRelationship) ? newRelationship : [newRelationship];
    if (relationshipArray.length === 0) {
      return c.json(Errors.serverError('Failed to create relationship'), 500);
    }

    return c.json(successResponse(relationshipArray[0]));
  }
);

// DELETE /api/admin/v1/organizations/:orgId/relationships/:relationshipId
app.delete(
  '/:orgId/relationships/:relationshipId',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:update'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const relationshipId = c.req.param('relationshipId');

    // Verify relationship exists
    const relationship = await db.query.postRelationships.findFirst({
      where: (pr, { eq }) => eq(pr.id, relationshipId),
    });

    if (!relationship) {
      return c.json(Errors.notFound('Relationship'), 404);
    }

    // Verify the relationship belongs to the organization by checking the fromPost
    const fromPost = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.id, relationship.fromPostId),
        eq(p.organizationId, organizationId!)
      ),
    });

    if (!fromPost) {
      return c.json(Errors.notFound('Relationship'), 404);
    }

    await db
      .delete(postRelationships)
      .where(eq(postRelationships.id, relationshipId));

    return c.json(successResponse({ deleted: true }));
  }
);

export default app;

