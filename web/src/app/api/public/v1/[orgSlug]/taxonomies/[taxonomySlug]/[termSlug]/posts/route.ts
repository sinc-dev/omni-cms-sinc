import { eq, and, like, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { withPublic } from '@/lib/api/public-wrapper';
import { successResponse, paginatedResponse, Errors } from '@/lib/api/response';
import { getPaginationParams, getOffset, parseDateParam, parseSortParam } from '@/lib/api/validation';
import {
  posts,
  organizations,
  postTypes,
  users,
  postTaxonomies,
  taxonomyTerms,
  taxonomies,
  media,
} from '@/db/schema';
import { getMediaVariantUrls } from '@/lib/media/urls';

export const runtime = 'edge';

interface PostTaxonomyData {
  postId: string;
}

// GET /api/public/v1/:orgSlug/taxonomies/:taxonomySlug/:termSlug/posts - List posts by taxonomy term
export const GET = withPublic(
  async (request, { db }, params) => {
    const orgSlug = params?.orgSlug;
    const taxonomySlug = params?.taxonomySlug;
    const termSlug = params?.termSlug;

    if (!orgSlug || !taxonomySlug || !termSlug) {
      return Errors.badRequest('Organization slug, taxonomy slug, and term slug required');
    }
  const url = new URL(request.url);

  // Find organization by slug
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, orgSlug),
  });

  if (!organization) {
    return Errors.notFound('Organization');
  }

  // Find taxonomy by slug
  const taxonomy = await db.query.taxonomies.findFirst({
    where: and(
      eq(taxonomies.organizationId, organization.id),
      eq(taxonomies.slug, taxonomySlug)
    ),
  });

  if (!taxonomy) {
    return Errors.notFound('Taxonomy');
  }

  // Find term by slug
  const term = await db.query.taxonomyTerms.findFirst({
    where: and(
      eq(taxonomyTerms.taxonomyId, taxonomy.id),
      eq(taxonomyTerms.slug, termSlug)
    ),
  });

  if (!term) {
    return Errors.notFound('Term');
  }

  const { page, perPage } = getPaginationParams(url);
  const offset = getOffset(page, perPage);

  // Get filter parameters
  const postType = url.searchParams.get('post_type') ?? undefined;
  const search = url.searchParams.get('search') ?? undefined;
  const publishedFrom = url.searchParams.get('published_from') ?? undefined;
  const publishedTo = url.searchParams.get('published_to') ?? undefined;
  const sort = url.searchParams.get('sort') ?? 'publishedAt_desc';

  // Find all posts with this taxonomy term
  const postIdsWithTerm = await db
    .select({ postId: postTaxonomies.postId })
    .from(postTaxonomies)
    .where(eq(postTaxonomies.taxonomyTermId, term.id));

  const postIds = postIdsWithTerm.map((p: PostTaxonomyData) => p.postId);

  if (postIds.length === 0) {
    return paginatedResponse([], page, perPage, 0);
  }

  // Build where conditions - only published posts
  const conditions = [
    eq(posts.organizationId, organization.id),
    eq(posts.status, 'published'),
    inArray(posts.id, postIds),
  ];

  if (postType) {
    const postTypeRecord = await db.query.postTypes.findFirst({
      where: and(
        eq(postTypes.organizationId, organization.id),
        eq(postTypes.slug, postType)
      ),
    });
    if (postTypeRecord) {
      conditions.push(eq(posts.postTypeId, postTypeRecord.id));
    }
  }

  if (search) {
    conditions.push(like(posts.title, `%${search}%`));
  }

  // Date range filters
  if (publishedFrom) {
    const fromDate = parseDateParam(publishedFrom);
    if (!fromDate) {
      return Errors.badRequest('Invalid published_from date format');
    }
    conditions.push(gte(posts.publishedAt, fromDate));
  }

  if (publishedTo) {
    const toDate = parseDateParam(publishedTo);
    if (!toDate) {
      return Errors.badRequest('Invalid published_to date format');
    }
    conditions.push(lte(posts.publishedAt, toDate));
  }

  const orderBy = parseSortParam(sort, {
    publishedAt: posts.publishedAt,
    createdAt: posts.createdAt,
    updatedAt: posts.updatedAt,
    title: posts.title,
  }, 'publishedAt', 'desc');

  // Fetch posts with relations
  const allPosts = await db.query.posts.findMany({
    where: and(...conditions),
    limit: perPage,
    offset,
    orderBy,
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      postType: {
        columns: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(...conditions));
  const total = totalResult[0]?.count || 0;

  // Fetch taxonomies, featured images, and format data for each post
  const postsWithRelations = await Promise.all(
    allPosts.map(async (post: any) => {
      // Fetch taxonomies
      const postTaxonomiesData = await db.query.postTaxonomies.findMany({
        where: eq(postTaxonomies.postId, post.id),
      });

      const taxonomyTermsData = await Promise.all(
        postTaxonomiesData.map(async (pt: any) => {
          const termData = await db.query.taxonomyTerms.findFirst({
            where: eq(taxonomyTerms.id, pt.taxonomyTermId),
            with: {
              taxonomy: {
                columns: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          });
          return termData;
        })
      );

      // Fetch featured image if present
      let featuredImage = null;
      if (post.featuredImageId) {
        const featuredMedia = await db.query.media.findFirst({
          where: eq(media.id, post.featuredImageId),
        });
        if (featuredMedia) {
          const urls = getMediaVariantUrls(featuredMedia);
          featuredImage = {
            id: featuredMedia.id,
            ...urls,
            altText: featuredMedia.altText,
            caption: featuredMedia.caption,
          };
        }
      }

      // Group taxonomies by taxonomy slug
      const taxonomiesBySlug: Record<string, any[]> = {};
      taxonomyTermsData.filter(Boolean).forEach((term: any) => {
        const taxonomySlug = term.taxonomy?.slug || 'uncategorized';
        if (!taxonomiesBySlug[taxonomySlug]) {
          taxonomiesBySlug[taxonomySlug] = [];
        }
        taxonomiesBySlug[taxonomySlug].push({
          id: term.id,
          name: term.name,
          slug: term.slug,
        });
      });

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        author: {
          id: post.author.id,
          name: post.author.name,
          email: post.author.email,
          avatarUrl: post.author.avatarUrl || null,
        },
        postType: {
          id: post.postType.id,
          name: post.postType.name,
          slug: post.postType.slug,
        },
        featuredImage,
        taxonomies: taxonomiesBySlug,
      };
    })
  );

  // Set caching headers (5 minutes)
  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const response = paginatedResponse(postsWithRelations, page, perPage, total);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...Object.fromEntries(headers),
      'Content-Type': 'application/json',
    },
  });
  }
);

