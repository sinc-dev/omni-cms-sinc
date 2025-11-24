import type { DbClient } from '@/db/client';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { posts, organizations, postTypes, taxonomies, media } from '@/db/schema';

export interface GraphQLContext {
  db: DbClient;
  organizationId?: string;
  user?: { id: string; email: string };
}

export const resolvers = {
  Query: {
    posts: async (
      _parent: unknown,
      args: { organizationId: string; limit?: number; offset?: number; status?: string },
      context: GraphQLContext
    ) => {
      const conditions = [eq(posts.organizationId, args.organizationId)];
      if (args.status) {
        conditions.push(eq(posts.status, args.status));
      }

      return context.db.query.posts.findMany({
        where: and(...conditions),
        limit: args.limit || 20,
        offset: args.offset || 0,
        with: {
          author: true,
          postType: true,
        },
      });
    },

    post: async (
      _parent: unknown,
      args: { organizationId: string; postId: string },
      context: GraphQLContext
    ) => {
      return context.db.query.posts.findFirst({
        where: and(
          eq(posts.id, args.postId),
          eq(posts.organizationId, args.organizationId)
        ),
        with: {
          author: true,
          postType: true,
        },
      });
    },

    postBySlug: async (
      _parent: unknown,
      args: { organizationSlug: string; postSlug: string },
      context: GraphQLContext
    ) => {
      const org = await context.db.query.organizations.findFirst({
        where: eq(organizations.slug, args.organizationSlug),
      });

      if (!org) {
        return null;
      }

      return context.db.query.posts.findFirst({
        where: and(
          eq(posts.organizationId, org.id),
          eq(posts.slug, args.postSlug),
          eq(posts.status, 'published')
        ),
        with: {
          author: true,
          postType: true,
        },
      });
    },

    postTypes: async (
      _parent: unknown,
      args: { organizationId: string },
      context: GraphQLContext
    ) => {
      return context.db.query.postTypes.findMany({
        where: eq(postTypes.organizationId, args.organizationId),
      });
    },

    taxonomies: async (
      _parent: unknown,
      args: { organizationId: string },
      context: GraphQLContext
    ) => {
      return context.db.query.taxonomies.findMany({
        where: eq(taxonomies.organizationId, args.organizationId),
        with: {
          terms: true,
        },
      });
    },

    taxonomy: async (
      _parent: unknown,
      args: { organizationId: string; taxonomyId: string },
      context: GraphQLContext
    ) => {
      return context.db.query.taxonomies.findFirst({
        where: and(
          eq(taxonomies.id, args.taxonomyId),
          eq(taxonomies.organizationId, args.organizationId)
        ),
        with: {
          terms: true,
        },
      });
    },

    media: async (
      _parent: unknown,
      args: { organizationId: string; limit?: number; offset?: number },
      context: GraphQLContext
    ) => {
      return context.db.query.media.findMany({
        where: eq(media.organizationId, args.organizationId),
        limit: args.limit || 20,
        offset: args.offset || 0,
      });
    },

    mediaItem: async (
      _parent: unknown,
      args: { organizationId: string; mediaId: string },
      context: GraphQLContext
    ) => {
      return context.db.query.media.findFirst({
        where: and(
          eq(media.id, args.mediaId),
          eq(media.organizationId, args.organizationId)
        ),
      });
    },
  },

  Mutation: {
    createPost: async (
      _parent: unknown,
      args: { organizationId: string; input: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      const input = args.input as {
        postTypeId: string;
        title: string;
        slug: string;
        content?: string;
        excerpt?: string;
        status?: string;
        featuredImageId?: string;
      };

      // Check if slug already exists
      const existing = await context.db.query.posts.findFirst({
        where: and(
          eq(posts.organizationId, args.organizationId),
          eq(posts.postTypeId, input.postTypeId),
          eq(posts.slug, input.slug)
        ),
      });

      if (existing) {
        throw new Error('Post with this slug already exists for this post type');
      }

      const newPost = await context.db
        .insert(posts)
        .values({
          id: nanoid(),
          organizationId: args.organizationId,
          authorId: context.user.id,
          postTypeId: input.postTypeId,
          title: input.title,
          slug: input.slug,
          content: input.content || null,
          excerpt: input.excerpt || null,
          status: input.status || 'draft',
          featuredImageId: input.featuredImageId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const post = Array.isArray(newPost) ? newPost[0] : newPost;
      if (!post) {
        throw new Error('Failed to create post');
      }

      return context.db.query.posts.findFirst({
        where: eq(posts.id, post.id),
        with: {
          author: true,
          postType: true,
        },
      });
    },

    updatePost: async (
      _parent: unknown,
      args: { organizationId: string; postId: string; input: Record<string, unknown> },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      const input = args.input as {
        title?: string;
        slug?: string;
        content?: string;
        excerpt?: string;
        status?: string;
        featuredImageId?: string;
      };

      // Verify post exists and belongs to organization
      const existing = await context.db.query.posts.findFirst({
        where: and(
          eq(posts.id, args.postId),
          eq(posts.organizationId, args.organizationId)
        ),
      });

      if (!existing) {
        throw new Error('Post not found');
      }

      // Check slug uniqueness if slug is being updated
      if (input.slug && input.slug !== existing.slug) {
        const slugExists = await context.db.query.posts.findFirst({
          where: and(
            eq(posts.organizationId, args.organizationId),
            eq(posts.postTypeId, existing.postTypeId),
            eq(posts.slug, input.slug)
          ),
        });

        if (slugExists) {
          throw new Error('Post with this slug already exists for this post type');
        }
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.slug !== undefined) updateData.slug = input.slug;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.excerpt !== undefined) updateData.excerpt = input.excerpt;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.featuredImageId !== undefined) updateData.featuredImageId = input.featuredImageId;

      await context.db
        .update(posts)
        .set(updateData)
        .where(and(
          eq(posts.id, args.postId),
          eq(posts.organizationId, args.organizationId)
        ));

      return context.db.query.posts.findFirst({
        where: eq(posts.id, args.postId),
        with: {
          author: true,
          postType: true,
        },
      });
    },

    deletePost: async (
      _parent: unknown,
      args: { organizationId: string; postId: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }

      // Verify post exists and belongs to organization
      const existing = await context.db.query.posts.findFirst({
        where: and(
          eq(posts.id, args.postId),
          eq(posts.organizationId, args.organizationId)
        ),
      });

      if (!existing) {
        throw new Error('Post not found');
      }

      await context.db
        .delete(posts)
        .where(and(
          eq(posts.id, args.postId),
          eq(posts.organizationId, args.organizationId)
        ));

      return true;
    },
  },
};

