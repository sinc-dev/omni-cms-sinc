'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchBar } from '@/components/search/search-bar';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
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

export default function SearchPage() {
  const { getUrl } = useOrgUrl();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!api || !organization || !query || orgLoading) {
      return;
    }

    const performSearch = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = (await api.searchPosts(query, {
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

      if (response.success) {
        setResults(response.data);
        setTotal(response.meta.total);
      } else {
        handleError('Search failed', { title: 'Search Failed' });
      }
      setLoading(false);
    }, { title: 'Search Failed' });

    performSearch();
  }, [api, organization, query, orgLoading]);

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to search.'}
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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && query && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Found {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>

          {results.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results found
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="hover:bg-accent/50 transition-colors">
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
                          <p className="text-sm text-muted-foreground mt-1">
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
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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

