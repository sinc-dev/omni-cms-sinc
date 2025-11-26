'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { SearchBar } from '@/components/search/search-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrgUrl } from '@/lib/hooks/use-org-url';

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  postType?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function OrgSearchPageClient() {
  const { getUrl } = useOrgUrl();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Fetch guards to prevent infinite loops and redundant requests
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query (500ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    if (!api || !organization || !debouncedQuery || orgLoading) {
      setResults([]);
      setTotal(0);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const performSearch = withErrorHandling(
      async () => {
        isFetchingRef.current = true;
        setLoading(true);
        clearError();

        const response = (await api.searchPosts(debouncedQuery, {
          page: '1',
          per_page: '20',
        })) as {
          success: boolean;
          data: SearchResult[];
          meta: {
            total: number;
            page: number;
            perPage: number;
            totalPages: number;
          };
        };

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        if (response.success) {
          setResults(response.data);
          setTotal(response.meta.total);
        } else {
          handleError('Search failed', { title: 'Search Failed' });
        }
        setLoading(false);
        isFetchingRef.current = false;
      },
      { title: 'Search Failed' },
    );

    performSearch();

    // Cleanup: Abort request on unmount or when dependencies change
    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, organization, debouncedQuery]);

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading
                ? 'Loading...'
                : 'Please select an organization to search.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">Search across all posts</p>
      </div>

      <SearchBar placeholder="Search posts by title, content, or excerpt..." />

      {loading && debouncedQuery && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="hover:bg-accent/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-6 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-1 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && debouncedQuery && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Found {total} result{total !== 1 ? 's' : ''} for &quot;
            {debouncedQuery}&quot;
          </p>

          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="transition-colors hover:bg-accent/50"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          <Link
                            href={getUrl(`posts/${result.id}`)}
                            className="hover:underline"
                          >
                            {result.title}
                          </Link>
                        </CardTitle>
                        {result.postType && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {result.postType.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          result.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : result.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status}
                      </span>
                    </div>
                  </CardHeader>
                  {result.excerpt && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {result.excerpt}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {!query && (
        <Card>
          <CardContent className="pt-6">
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enter a search query to find posts
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


