/**
 * Example component demonstrating how to use the public API client
 * to display a paginated list of posts
 */

'use client';

import { usePublicPosts } from '@/lib/hooks/use-public-posts';
import { PublicPost } from '@/lib/public-api-client';

interface PostsListProps {
  orgSlug: string;
  postType?: string;
  perPage?: number;
  showPagination?: boolean;
}

export function PostsList({ 
  orgSlug, 
  postType, 
  perPage = 20,
  showPagination = true 
}: PostsListProps) {
  const { 
    posts, 
    meta, 
    isLoading, 
    isError, 
    error, 
    nextPage, 
    previousPage,
    goToPage 
  } = usePublicPosts({
    orgSlug,
    postType,
    perPage,
    sort: 'publishedAt_desc',
    revalidateInterval: 300000, // Revalidate every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Error loading posts: {error?.message}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No posts found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {showPagination && meta && meta.totalPages > 1 && (
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          total={meta.total}
          onNext={nextPage}
          onPrevious={previousPage}
          onGoToPage={goToPage}
        />
      )}
    </div>
  );
}

function PostCard({ post }: { post: PublicPost }) {
  return (
    <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <div className="aspect-video bg-gray-200">
          <img
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {post.author.avatarUrl && (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name || ''}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span>{post.author.name || post.author.email}</span>
          </div>
          
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString()}
            </time>
          )}
        </div>

        {Object.keys(post.taxonomies).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(post.taxonomies).map(([taxonomySlug, terms]) =>
              terms.map((term) => (
                <span
                  key={term.id}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  {term.name}
                </span>
              ))
            )}
          </div>
        )}
      </div>
    </article>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  onGoToPage: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  total,
  onNext,
  onPrevious,
  onGoToPage,
}: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (currentPage <= 4) return i + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + i;
    return currentPage - 3 + i;
  });

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div className="text-sm text-gray-600">
        Showing page {currentPage} of {totalPages} ({total} total posts)
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>

        <div className="flex gap-1">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onGoToPage(page)}
              className={`px-3 py-2 border rounded ${
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

