import { Hono } from 'hono';
import { eq, and, inArray, or } from 'drizzle-orm';
import type { CloudflareBindings } from '../../types';
import { authMiddleware, orgAccessMiddleware, permissionMiddleware, getAuthContext } from '../../lib/api/hono-admin-middleware';
import { successResponse, Errors } from '../../lib/api/hono-response';
import { posts, postRelationships, postTypes, organizations } from '../../db/schema';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/admin/v1/organizations/:orgId/diagnostics/relationships
// Diagnostic endpoint to check relationship health for a specific post
app.get(
  '/:orgId/diagnostics/relationships',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postSlug = c.req.query('post_slug');
    const relationshipType = c.req.query('relationship_type');

    if (!postSlug) {
      return c.json(Errors.badRequest('post_slug query parameter is required'), 400);
    }

    // Find the post
    const post = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organizationId!),
        eq(p.slug, postSlug)
      ),
      with: {
        postType: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return c.json(Errors.notFound(`Post with slug "${postSlug}" not found`), 404);
    }

    // Get relationships where this post is the target (toPostId)
    const relationshipsTo = await db.query.postRelationships.findMany({
      where: (pr, { eq, and: andFn }) => {
        const conditions = [eq(pr.toPostId, post.id)];
        if (relationshipType) {
          conditions.push(eq(pr.relationshipType, relationshipType));
        }
        return andFn(...conditions);
      },
    });

    // Get relationships where this post is the source (fromPostId)
    const relationshipsFrom = await db.query.postRelationships.findMany({
      where: (pr, { eq, and: andFn }) => {
        const conditions = [eq(pr.fromPostId, post.id)];
        if (relationshipType) {
          conditions.push(eq(pr.relationshipType, relationshipType));
        }
        return andFn(...conditions);
      },
    });

    // Get all unique relationship types for this post
    const allRelationships = await db.query.postRelationships.findMany({
      where: (pr, { or }) => or(
        eq(pr.fromPostId, post.id),
        eq(pr.toPostId, post.id)
      ),
    });
    const uniqueTypes = [...new Set(allRelationships.map(r => r.relationshipType))];

    // Fetch related posts for relationshipsTo (outgoing relationships)
    const toPostIds = relationshipsTo.map(r => r.fromPostId);
    const toPosts = toPostIds.length > 0
      ? await db.query.posts.findMany({
          where: (p, { eq, and: andFn, inArray }) => andFn(
            inArray(p.id, toPostIds),
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

    // Fetch related posts for relationshipsFrom (incoming relationships)
    const fromPostIds = relationshipsFrom.map(r => r.toPostId);
    const fromPosts = fromPostIds.length > 0
      ? await db.query.posts.findMany({
          where: (p, { eq, and: andFn, inArray }) => andFn(
            inArray(p.id, fromPostIds),
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

    const toPostsMap = new Map(toPosts.map(p => [p.id, p]));
    const fromPostsMap = new Map(fromPosts.map(p => [p.id, p]));

    // Format relationships
    const formattedRelationshipsTo = relationshipsTo.map(rel => ({
      id: rel.id,
      direction: 'outgoing' as const,
      relationshipType: rel.relationshipType,
      relatedPost: toPostsMap.get(rel.fromPostId) || null,
      note: 'This post is the target (toPostId). Related posts are sources (fromPostId).',
    }));

    const formattedRelationshipsFrom = relationshipsFrom.map(rel => ({
      id: rel.id,
      direction: 'incoming' as const,
      relationshipType: rel.relationshipType,
      relatedPost: fromPostsMap.get(rel.toPostId) || null,
      note: 'This post is the source (fromPostId). Related posts are targets (toPostId).',
    }));

    // Check for published status
    const publishedToPosts = toPosts.filter(p => p.status === 'published');
    const publishedFromPosts = fromPosts.filter(p => p.status === 'published');

    // Summary
    const summary = {
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        postType: post.postType,
      },
      relationships: {
        outgoing: {
          total: relationshipsTo.length,
          published: publishedToPosts.length,
          byType: relationshipsTo.reduce((acc, rel) => {
            acc[rel.relationshipType] = (acc[rel.relationshipType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        incoming: {
          total: relationshipsFrom.length,
          published: publishedFromPosts.length,
          byType: relationshipsFrom.reduce((acc, rel) => {
            acc[rel.relationshipType] = (acc[rel.relationshipType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
        allTypes: uniqueTypes,
      },
      diagnostic: {
        // For public API queries with related_to_slug, we look for relationships where
        // toPostId = this post (outgoing relationships)
        expectedForPublicApi: {
          direction: 'outgoing',
          description: 'Public API queries with related_to_slug look for relationships where toPostId = target post',
          count: relationshipsTo.length,
          publishedCount: publishedToPosts.length,
          filteredByType: relationshipType
            ? relationshipsTo.filter(r => r.relationshipType === relationshipType).length
            : relationshipsTo.length,
        },
        warnings: [] as string[],
      },
    };

    // Add warnings
    if (post.status !== 'published') {
      summary.diagnostic.warnings.push(
        `Post is not published (status: ${post.status}). Public API queries require published posts.`
      );
    }

    if (relationshipsTo.length === 0 && relationshipsFrom.length > 0) {
      summary.diagnostic.warnings.push(
        `No outgoing relationships found, but ${relationshipsFrom.length} incoming relationships exist. ` +
        `Relationships may be stored in reverse direction. Public API expects: fromPostId=related_post, toPostId=this_post`
      );
    }

    if (relationshipsTo.length > 0 && publishedToPosts.length === 0) {
      summary.diagnostic.warnings.push(
        `Found ${relationshipsTo.length} outgoing relationships, but none of the related posts are published.`
      );
    }

    if (relationshipType && !uniqueTypes.includes(relationshipType)) {
      summary.diagnostic.warnings.push(
        `No relationships found with type "${relationshipType}". Available types: ${uniqueTypes.join(', ')}`
      );
    }

    return c.json(successResponse({
      summary,
      outgoingRelationships: formattedRelationshipsTo,
      incomingRelationships: formattedRelationshipsFrom,
    }));
  }
);

// GET /api/admin/v1/organizations/:orgId/diagnostics/relationships/check
// Quick check endpoint to verify relationship direction for a specific query
app.get(
  '/:orgId/diagnostics/relationships/check',
  authMiddleware,
  orgAccessMiddleware,
  permissionMiddleware('posts:read'),
  async (c) => {
    const { db, organizationId } = getAuthContext(c);
    const postSlug = c.req.query('post_slug');
    const relationshipType = c.req.query('relationship_type');
    const postTypeSlug = c.req.query('post_type');

    if (!postSlug) {
      return c.json(Errors.badRequest('post_slug query parameter is required'), 400);
    }

    // Find the target post
    const targetPost = await db.query.posts.findFirst({
      where: (p, { eq, and: andFn }) => andFn(
        eq(p.organizationId, organizationId!),
        eq(p.slug, postSlug)
      ),
    });

    if (!targetPost) {
      return c.json(Errors.notFound(`Post with slug "${postSlug}" not found`), 404);
    }

    // Check if post is published
    const isPublished = targetPost.status === 'published';

    // Get relationships (correct direction for public API)
    const relationships = await db.query.postRelationships.findMany({
      where: (pr, { eq, and: andFn }) => {
        const conditions = [eq(pr.toPostId, targetPost.id)];
        if (relationshipType) {
          conditions.push(eq(pr.relationshipType, relationshipType));
        }
        return andFn(...conditions);
      },
    });

    // Get reverse relationships (in case they're stored backwards)
    const reverseRelationships = await db.query.postRelationships.findMany({
      where: (pr, { eq, and: andFn }) => {
        const conditions = [eq(pr.fromPostId, targetPost.id)];
        if (relationshipType) {
          conditions.push(eq(pr.relationshipType, relationshipType));
        }
        return andFn(...conditions);
      },
    });

    // Get related post IDs
    const relatedPostIds = relationships.map(r => r.fromPostId);
    const reverseRelatedPostIds = reverseRelationships.map(r => r.toPostId);

    // Fetch related posts
    const relatedPosts = relatedPostIds.length > 0
      ? await db.query.posts.findMany({
          where: (p, { eq, and: andFn, inArray }) => {
            const conditions = [
              inArray(p.id, relatedPostIds),
              eq(p.organizationId, organizationId!),
            ];
            if (postTypeSlug) {
              // This would need a join, but for now we'll filter after
            }
            return andFn(...conditions);
          },
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

    // Filter by post type if specified
    let filteredPosts = relatedPosts;
    if (postTypeSlug) {
      const postType = await db.query.postTypes.findFirst({
        where: (pt, { eq, and: andFn }) => andFn(
          eq(pt.organizationId, organizationId!),
          eq(pt.slug, postTypeSlug)
        ),
      });
      if (postType) {
        filteredPosts = relatedPosts.filter(p => p.postTypeId === postType.id);
      }
    }

    const publishedPosts = filteredPosts.filter(p => p.status === 'published');

    return c.json(successResponse({
      targetPost: {
        id: targetPost.id,
        title: targetPost.title,
        slug: targetPost.slug,
        status: targetPost.status,
        isPublished,
      },
      relationships: {
        correctDirection: {
          count: relationships.length,
          relatedPostIds,
          note: 'Relationships where toPostId = target post (correct for public API)',
        },
        reverseDirection: {
          count: reverseRelationships.length,
          relatedPostIds: reverseRelatedPostIds,
          note: 'Relationships where fromPostId = target post (may indicate backwards storage)',
        },
      },
      relatedPosts: {
        total: filteredPosts.length,
        published: publishedPosts.length,
        posts: filteredPosts.map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          status: p.status,
          postType: p.postType,
        })),
      },
      publicApiQuery: {
        wouldReturnResults: isPublished && publishedPosts.length > 0,
        reason: !isPublished
          ? 'Target post is not published'
          : publishedPosts.length === 0
          ? 'No published related posts found'
          : 'Query should return results',
        expectedCount: publishedPosts.length,
      },
    }));
  }
);

export default app;
