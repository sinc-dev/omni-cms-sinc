'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { useSchema } from '@/lib/hooks/use-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/filters/filter-bar';
import { Suspense } from 'react';

import { useFilterParams } from '@/lib/hooks/use-filter-params';
import type { SortOption } from '@/components/filters/sort-selector';
import { useOrgUrl } from '@/lib/hooks/use-org-url';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  postType?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PaginatedResponse {
  success: true;
  data: Post[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface PostType {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

function PostsPageContent() {
  const { getUrl } = useOrgUrl();
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { success: showSuccess } = useToastHelpers();
  const { schema: postsSchema } = useSchema('posts');
  const { getFilter, updateFilters } = useFilterParams();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const filterDataFetchedRef = useRef(false);
  const isFetchingFilterDataRef = useRef(false);
  const filterDataAbortControllerRef = useRef<AbortController | null>(null);
  
  // Get filter values from URL
  const statusFilter = getFilter('status') || 'all';
  const postTypeFilter = getFilter('post_type') || 'all';
  const authorFilter = getFilter('author_id') || 'all';
  const createdFrom = getFilter('created_from');
  const createdTo = getFilter('created_to');
  const publishedFrom = getFilter('published_from');
  const publishedTo = getFilter('published_to');
  const sortValue = getFilter('sort') || 'createdAt_desc';

  // Date range state
  const [createdDateRange, setCreatedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: createdFrom ? new Date(createdFrom) : undefined,
    to: createdTo ? new Date(createdTo) : undefined,
  });

  const [publishedDateRange, setPublishedDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: publishedFrom ? new Date(publishedFrom) : undefined,
    to: publishedTo ? new Date(publishedTo) : undefined,
  });

  // Sync date ranges with URL params
  useEffect(() => {
    if (createdFrom || createdTo) {
      setCreatedDateRange({
        from: createdFrom ? new Date(createdFrom) : undefined,
        to: createdTo ? new Date(createdTo) : undefined,
      });
    }
  }, [createdFrom, createdTo]);

  useEffect(() => {
    if (publishedFrom || publishedTo) {
      setPublishedDateRange({
        from: publishedFrom ? new Date(publishedFrom) : undefined,
        to: publishedTo ? new Date(publishedTo) : undefined,
      });
    }
  }, [publishedFrom, publishedTo]);

  // Handle date range changes
  const handleCreatedDateRangeChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setCreatedDateRange(range);
    updateFilters({
      created_from: range.from?.toISOString().split('T')[0],
      created_to: range.to?.toISOString().split('T')[0],
    });
  };

  const handlePublishedDateRangeChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setPublishedDateRange(range);
    updateFilters({
      published_from: range.from?.toISOString().split('T')[0],
      published_to: range.to?.toISOString().split('T')[0],
    });
  };

  // Get status enum values from schema
  const statusProperty = postsSchema?.properties?.find(p => p.name === 'status');
  const statusOptions = statusProperty?.options || [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'createdAt_desc', label: 'Created: Newest', field: 'createdAt', order: 'desc' },
    { value: 'createdAt_asc', label: 'Created: Oldest', field: 'createdAt', order: 'asc' },
    { value: 'updatedAt_desc', label: 'Updated: Newest', field: 'updatedAt', order: 'desc' },
    { value: 'updatedAt_asc', label: 'Updated: Oldest', field: 'updatedAt', order: 'asc' },
    { value: 'publishedAt_desc', label: 'Published: Newest', field: 'publishedAt', order: 'desc' },
    { value: 'publishedAt_asc', label: 'Published: Oldest', field: 'publishedAt', order: 'asc' },
    { value: 'title_asc', label: 'Title: A-Z', field: 'title', order: 'asc' },
    { value: 'title_desc', label: 'Title: Z-A', field: 'title', order: 'desc' },
  ];

  // Fetch post types and users for filters
  useEffect(() => {
    // Guard: Prevent multiple simultaneous requests
    if (isFetchingFilterDataRef.current) return;
    
    // Guard: Early return if already fetched
    if (filterDataFetchedRef.current && postTypes.length > 0 && users.length > 0) return;
    
    if (!organization) return;

    isFetchingFilterDataRef.current = true;
    filterDataAbortControllerRef.current = new AbortController();

    const fetchFilterData = withErrorHandling(async () => {
      try {
        const [postTypesResponse, usersResponse] = await Promise.all([
          api.getPostTypes() as Promise<{ success: boolean; data: PostType[] }>,
          api.getUsers() as Promise<{ success: boolean; data: User[] }>,
        ]);

        if (filterDataAbortControllerRef.current?.signal.aborted) return;

        if (postTypesResponse.success) {
          setPostTypes(postTypesResponse.data);
        }
        if (usersResponse.success) {
          setUsers(usersResponse.data);
        }
        filterDataFetchedRef.current = true;
      } catch (err) {
        if (filterDataAbortControllerRef.current?.signal.aborted) return;
        // Error is handled by withErrorHandling wrapper
        // Show user-friendly message but don't block the page
        handleError(err, { 
          title: 'Failed to Load Filter Options'
        });
      } finally {
        isFetchingFilterDataRef.current = false;
      }
    }, { 
      title: 'Failed to Load Filter Options',
      showToast: false // Don't show toast for filter failures to avoid noise
    });

    fetchFilterData();

    // Cleanup: Abort request on unmount
    return () => {
      filterDataAbortControllerRef.current?.abort();
      isFetchingFilterDataRef.current = false;
    };
  }, [organization, api, postTypes.length, users.length, withErrorHandling, handleError]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch posts
  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchPosts = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (postTypeFilter !== 'all') {
        params.post_type = postTypeFilter;
      }

      if (authorFilter !== 'all') {
        params.author_id = authorFilter;
      }

      if (createdFrom) {
        params.created_from = createdFrom;
      }

      if (createdTo) {
        params.created_to = createdTo;
      }

      if (publishedFrom) {
        params.published_from = publishedFrom;
      }

      if (publishedTo) {
        params.published_to = publishedTo;
      }

      if (sortValue) {
        params.sort = sortValue;
      }

      const response = (await api.getPosts(params)) as PaginatedResponse;
      
      if (response.success) {
        setPosts(response.data);
        setTotal(response.meta.total);
      } else {
        handleError('Failed to load posts', { title: 'Failed to Load Posts' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Posts' });

    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, page, debouncedSearch, statusFilter, postTypeFilter, authorFilter, createdFrom, createdTo, publishedFrom, publishedTo, sortValue, api, perPage]);

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view posts.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            Manage your content posts
          </p>
        </div>
        <Link href={getUrl('posts/new')}>
          <Button aria-label="Create new post">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Post</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search posts by title..."
            quickFilters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                options: [
                  { value: 'all', label: 'All' },
                  ...statusOptions,
                ],
                onChange: (value) => updateFilters({ status: value === 'all' ? undefined : value }),
              },
              {
                key: 'post_type',
                label: 'Post Type',
                value: postTypeFilter,
                options: [
                  { value: 'all', label: 'All' },
                  ...postTypes.map((pt) => ({ value: pt.id, label: pt.name })),
                ],
                onChange: (value) => updateFilters({ post_type: value === 'all' ? undefined : value }),
              },
              {
                key: 'author_id',
                label: 'Author',
                value: authorFilter,
                options: [
                  { value: 'all', label: 'All' },
                  ...users.map((u) => ({ value: u.id, label: u.name })),
                ],
                onChange: (value) => updateFilters({ author_id: value === 'all' ? undefined : value }),
              },
            ]}
            dateRangeFilters={[
              {
                key: 'created',
                label: 'Created Date',
                value: createdDateRange,
                onChange: handleCreatedDateRangeChange,
              },
              {
                key: 'published',
                label: 'Published Date',
                value: publishedDateRange,
                onChange: handlePublishedDateRangeChange,
              },
            ]}
            sortOptions={sortOptions}
            sortValue={sortValue}
            onSortChange={(value) => updateFilters({ sort: value })}
            onClearAll={() => {
              setSearch('');
              setCreatedDateRange({ from: undefined, to: undefined });
              setPublishedDateRange({ from: undefined, to: undefined });
              updateFilters({
                status: undefined,
                post_type: undefined,
                author_id: undefined,
                created_from: undefined,
                created_to: undefined,
                published_from: undefined,
                published_to: undefined,
                sort: undefined,
              });
            }}
          />
        </CardHeader>

        <CardContent>
          {loading && (
            <>
              {/* Desktop Table Skeleton */}
              <div className="hidden md:block rounded-md border">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left"><Skeleton className="h-4 w-20" /></th>
                      <th className="h-10 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                      <th className="h-10 px-4 text-left"><Skeleton className="h-4 w-16" /></th>
                      <th className="h-10 px-4 text-left"><Skeleton className="h-4 w-20" /></th>
                      <th className="h-10 px-4 text-left"><Skeleton className="h-4 w-24" /></th>
                      <th className="h-10 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="border-b">
                        <td className="p-4">
                          <Skeleton className="h-5 w-48 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Skeleton */}
              <div className="md:hidden space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 mb-1" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && posts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No posts found. Create your first post to get started.
              </p>
            </div>
          )}

          {!loading && !error && posts.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <table className="w-full" role="table" aria-label="Posts list">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm" scope="col">
                        Title
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm" scope="col">
                        Type
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm" scope="col">
                        Status
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm" scope="col">
                        Author
                      </th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-sm" scope="col">
                        Updated
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-sm" scope="col">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div>
                            <div className="font-medium">{post.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {post.slug}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          {post.postType?.name || '—'}
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              post.status === 'published'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : post.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                            aria-label={`Status: ${post.status}`}
                          >
                            {post.status}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-sm">
                          {post.author?.name || '—'}
                        </td>
                        <td className="p-4 align-middle text-sm text-muted-foreground">
                          {post.updatedAt
                            ? new Date(post.updatedAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={getUrl(`posts/${post.id}`)} aria-label={`Edit post: ${post.title}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label={`Delete post: ${post.title}`}
                              onClick={() => {
                                setPostToDelete(post);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{post.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{post.slug}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={getUrl(`posts/${post.id}`)} aria-label={`Edit post: ${post.title}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              aria-label={`Delete post: ${post.title}`}
                              onClick={() => {
                                setPostToDelete(post);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Type: </span>
                            <span>{post.postType?.name || '—'}</span>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : post.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                              }`}
                              aria-label={`Status: ${post.status}`}
                            >
                              {post.status}
                            </span>
                          </div>
                          {post.author && (
                            <div>
                              <span className="text-muted-foreground">Author: </span>
                              <span>{post.author.name}</span>
                            </div>
                          )}
                          {post.updatedAt && (
                            <div>
                              <span className="text-muted-foreground">Updated: </span>
                              <span>{new Date(post.updatedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * perPage + 1} to{' '}
                    {Math.min(page * perPage, total)} of {total} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (!postToDelete) return;
          const deletedTitle = postToDelete.title;
          await withErrorHandling(async () => {
            await api.deletePost(postToDelete.id);
            // Refresh posts by triggering a refetch
            setPage(1);
            setPostToDelete(null);
            showSuccess(`Post "${deletedTitle}" deleted successfully`, 'Post Deleted');
          }, { title: 'Failed to Delete Post' })();
        }}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        itemName={postToDelete ? `"${postToDelete.title}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

export default function PostsPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        </div>
      }
    >
      <PostsPageContent />
    </Suspense>
  );
}

