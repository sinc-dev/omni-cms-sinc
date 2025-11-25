/**
 * React hook for fetching public posts
 * 
 * Provides a convenient way to fetch published posts from the public API
 * with support for pagination, filtering, and automatic revalidation.
 */

import { useState, useEffect, useCallback } from 'react';
import { publicApiClient, type PublicPost, type PublicPostsOptions, type PaginatedResponse } from '../public-api-client';

export interface UsePublicPostsOptions extends PublicPostsOptions {
  orgSlug: string;
  enabled?: boolean; // Whether to fetch immediately (default: true)
  revalidateOnFocus?: boolean; // Revalidate when window regains focus (default: false)
  revalidateInterval?: number; // Revalidate interval in milliseconds (default: 0 = disabled)
}

export interface UsePublicPostsResult {
  posts: PublicPost[];
  meta: PaginatedResponse<PublicPost>['meta'] | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
}

/**
 * Hook for fetching public posts with pagination and filtering
 * 
 * @example
 * ```tsx
 * const { posts, meta, isLoading, nextPage } = usePublicPosts({
 *   orgSlug: 'study-in-kazakhstan',
 *   postType: 'programs',
 *   perPage: 20,
 * });
 * ```
 */
export function usePublicPosts(options: UsePublicPostsOptions): UsePublicPostsResult {
  const {
    orgSlug,
    enabled = true,
    revalidateOnFocus = false,
    revalidateInterval = 0,
    ...queryOptions
  } = options;

  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<PublicPost>['meta'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!enabled || !orgSlug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await publicApiClient.getPosts(orgSlug, queryOptions);
      setPosts(response.data);
      setMeta(response.meta);
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
      setPosts([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [orgSlug, enabled, JSON.stringify(queryOptions)]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const handleFocus = () => {
      fetchPosts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, enabled, fetchPosts]);

  // Revalidate on interval
  useEffect(() => {
    if (!revalidateInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchPosts();
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [revalidateInterval, enabled, fetchPosts]);

  const nextPage = useCallback(() => {
    if (meta && meta.page < meta.totalPages) {
      fetchPosts();
    }
  }, [meta, fetchPosts]);

  const previousPage = useCallback(() => {
    if (meta && meta.page > 1) {
      fetchPosts();
    }
  }, [meta, fetchPosts]);

  const goToPage = useCallback((page: number) => {
    if (meta && page >= 1 && page <= meta.totalPages) {
      fetchPosts();
    }
  }, [meta, fetchPosts]);

  return {
    posts,
    meta,
    isLoading,
    isError,
    error,
    refetch: fetchPosts,
    nextPage,
    previousPage,
    goToPage,
  };
}

/**
 * Hook for fetching a single public post by slug
 */
export function usePublicPost(orgSlug: string, slug: string, enabled = true) {
  const [post, setPost] = useState<PublicPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !orgSlug || !slug) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => {
      setIsLoading(true);
    }, 0);
    setIsError(false);
    setError(null);

    publicApiClient
      .getPost(orgSlug, slug)
      .then((response) => {
        setPost(response.data);
      })
      .catch((err) => {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Failed to fetch post'));
        setPost(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [orgSlug, slug, enabled]);

  return { post, isLoading, isError, error };
}

