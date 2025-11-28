'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Upload,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
  Video,
  File as FileIcon,
  Eye,
  X,
  MoreVertical,
  Download,
  Copy,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { MediaUploader } from '@/components/media/media-uploader';
import { FilterBar } from '@/components/filters/filter-bar';
import { Suspense } from 'react';

import { useFilterParams } from '@/lib/hooks/use-filter-params';
import type { SortOption } from '@/components/filters/sort-selector';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';

interface MediaItem {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  caption?: string | null;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  urls?: {
    url: string;
    thumbnailUrl: string;
    largeUrl: string;
  };
}

interface PaginatedResponse {
  success: boolean;
  data: MediaItem[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

function MediaPageContent() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const toast = useToastHelpers();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const { getFilter, updateFilters } = useFilterParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{ id: string; filename: string } | null>(null);
  
  // Get filter values from URL
  const typeFilter = getFilter('type') || 'all';
  const uploaderFilter = getFilter('uploader_id') || 'all';
  const createdFrom = getFilter('created_from');
  const createdTo = getFilter('created_to');
  const sortValue = getFilter('sort') || 'createdAt_desc';

  // Derive date range from URL params
  const createdDateRange = useMemo(() => ({
    from: createdFrom ? new Date(createdFrom) : undefined,
    to: createdTo ? new Date(createdTo) : undefined,
  }), [createdFrom, createdTo]);

  // Handle date range changes
  const handleCreatedDateRangeChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    updateFilters({
      created_from: range.from?.toISOString().split('T')[0],
      created_to: range.to?.toISOString().split('T')[0],
    });
  };

  // Sort options
  const sortOptions: SortOption[] = [
    { value: 'createdAt_desc', label: 'Created: Newest', field: 'createdAt', order: 'desc' },
    { value: 'createdAt_asc', label: 'Created: Oldest', field: 'createdAt', order: 'asc' },
    { value: 'filename_asc', label: 'Filename: A-Z', field: 'filename', order: 'asc' },
    { value: 'filename_desc', label: 'Filename: Z-A', field: 'filename', order: 'desc' },
  ];

  // Fetch users for filter
  useEffect(() => {
    if (!organization || !api) return;

    const fetchUsers = withErrorHandling(async () => {
      try {
        const response = (await api.getUsers()) as { success: boolean; data: Array<{ id: string; name: string; email: string }> };
        if (response.success) {
          setUsers(response.data);
        }
      } catch (err) {
        // Error is handled by withErrorHandling wrapper
        // Silently fail for filter data - don't block the page
        handleError(err, { 
          title: 'Failed to Load Filter Options',
          showToast: false // Don't show toast for filter failures
        });
      }
    }, { 
      title: 'Failed to Load Filter Options',
      showToast: false 
    });

    fetchUsers();
  }, [organization, api, withErrorHandling, handleError]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Derive loading state
  const loading = orgLoading || fetching;

  // Fetch media
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      return;
    }

    const fetchMedia = withErrorHandling(async () => {
      setFetching(true);
      clearError();

      const params: Record<string, string> = {
        page: page.toString(),
        per_page: perPage.toString(),
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (typeFilter !== 'all') {
        params.type = typeFilter;
      }

      if (uploaderFilter !== 'all') {
        params.uploader_id = uploaderFilter;
      }

      if (createdFrom) {
        params.created_from = createdFrom;
      }

      if (createdTo) {
        params.created_to = createdTo;
      }

      if (sortValue) {
        params.sort = sortValue;
      }

      const response = (await api.getMedia(params)) as PaginatedResponse;

      if (response.success) {
        setMedia(response.data);
        setTotal(response.meta.total);
      } else {
        handleError('Failed to load media', { title: 'Failed to Load Media' });
      }
      setFetching(false);
    }, { title: 'Failed to Load Media' });

    fetchMedia();
  }, [organization, api, page, debouncedSearch, typeFilter, uploaderFilter, createdFrom, createdTo, sortValue, perPage, orgLoading, clearError, handleError, withErrorHandling]);

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!api) return;

      const deletedMedia = mediaToDelete || media.find(m => m.id === mediaId);
      const deletedFilename = deletedMedia?.filename || 'media file';

      await withErrorHandling(async () => {
        await api.deleteMedia(mediaId);
        // Refresh media list
        setPage(1);
        setMediaToDelete(null);
        toast.success(`"${deletedFilename}" deleted successfully`, 'Media Deleted');
      }, { title: 'Failed to Delete Media' })();
    },
    [api, withErrorHandling, mediaToDelete, media, toast]
  );

  const handleCopyUrl = useCallback(
    async (item: MediaItem) => {
      if (!item.urls?.url) {
        toast.error('No URL available for this media item', 'Error');
        return;
      }

      try {
        await navigator.clipboard.writeText(item.urls.url);
        toast.success('URL copied to clipboard', 'Success');
      } catch {
        toast.error('Failed to copy URL', 'Error');
      }
    },
    [toast]
  );

  const handleDownload = useCallback(
    (item: MediaItem) => {
      if (!item.urls?.url) {
        toast.error('No URL available for this media item', 'Error');
        return;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = item.urls.url;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started', 'Success');
    },
    [toast]
  );

  const handleUploadComplete = useCallback(() => {
    setUploadDialogOpen(false);
    // Refresh media list
    setPage(1);
  }, []);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return ImageIcon;
    }
    if (mimeType.startsWith('video/')) {
      return Video;
    }
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalPages = Math.ceil(total / perPage);

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view media.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your images and files</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            <MediaUploader
              onUploadComplete={handleUploadComplete}
              accept={{
                'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
                'video/*': ['.mp4', '.webm', '.mov'],
                'application/*': ['.pdf', '.doc', '.docx'],
              }}
              maxSize={50 * 1024 * 1024} // 50MB
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <FilterBar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search media by filename..."
              quickFilters={[
                {
                  key: 'type',
                  label: 'Type',
                  value: typeFilter,
                  options: [
                    { value: 'all', label: 'All' },
                    { value: 'image', label: 'Images' },
                    { value: 'video', label: 'Videos' },
                    { value: 'other', label: 'Other' },
                  ],
                  onChange: (value) => updateFilters({ type: value === 'all' ? undefined : value }),
                },
                {
                  key: 'uploader_id',
                  label: 'Uploader',
                  value: uploaderFilter,
                  options: [
                    { value: 'all', label: 'All' },
                    ...users.map((u) => ({ value: u.id, label: u.name })),
                  ],
                  onChange: (value) => updateFilters({ uploader_id: value === 'all' ? undefined : value }),
                },
              ]}
              dateRangeFilters={[
                {
                  key: 'created',
                  label: 'Created Date',
                  value: createdDateRange,
                  onChange: handleCreatedDateRangeChange,
                },
              ]}
              sortOptions={sortOptions}
              sortValue={sortValue}
              onSortChange={(value) => updateFilters({ sort: value })}
              onClearAll={() => {
                setSearch('');
                updateFilters({
                  type: undefined,
                  uploader_id: undefined,
                  created_from: undefined,
                  created_to: undefined,
                  sort: undefined,
                });
              }}
            />
            <div className="flex justify-end">
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading media...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && media.length === 0 && (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No media files</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {debouncedSearch ? 'No files match your search.' : 'Upload your first file to get started'}
                </p>
                {!debouncedSearch && (
                  <Button
                    className="mt-4"
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </Button>
                )}
              </div>
            </div>
          )}

          {!loading && !error && media.length > 0 && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {media.map((item) => {
                    const isImage = item.mimeType.startsWith('image/');
                    const FileIconComponent = getFileIcon(item.mimeType);

                    return (
                      <div
                        key={item.id}
                        className="group relative aspect-square rounded-lg border bg-muted overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        {isImage && item.urls?.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.urls.thumbnailUrl}
                            alt={item.altText || item.filename}
                            className="w-full h-full object-cover"
                            onClick={() => {
                              setSelectedMedia(item);
                              setPreviewOpen(true);
                            }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            onClick={() => {
                              setSelectedMedia(item);
                              setPreviewOpen(true);
                            }}
                          >
                            <FileIconComponent className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}

                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMedia(item);
                                  setPreviewOpen(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(item);
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyUrl(item);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy URL
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMediaToDelete({ id: item.id, filename: item.filename });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Filename overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white truncate">{item.filename}</p>
                          <p className="text-xs text-white/70">{formatFileSize(item.fileSize)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                          Preview
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                          Filename
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                          Type
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                          Size
                        </th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-sm">
                          Uploaded
                        </th>
                        <th className="h-10 px-4 text-right align-middle font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {media.map((item) => {
                        const isImage = item.mimeType.startsWith('image/');
                        const FileIconComponent = getFileIcon(item.mimeType);

                        return (
                          <tr key={item.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              {isImage && item.urls?.thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.urls.thumbnailUrl}
                                  alt={item.altText || item.filename}
                                  className="h-12 w-12 object-cover rounded cursor-pointer"
                                  onClick={() => {
                                    setSelectedMedia(item);
                                    setPreviewOpen(true);
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                  <FileIconComponent className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </td>
                            <td className="p-4 align-middle">
                              <div>
                                <div className="font-medium">{item.filename}</div>
                                {item.altText && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.altText}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 align-middle text-sm text-muted-foreground">
                              {item.mimeType}
                            </td>
                            <td className="p-4 align-middle text-sm text-muted-foreground">
                              {formatFileSize(item.fileSize)}
                            </td>
                            <td className="p-4 align-middle text-sm text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedMedia(item);
                                      setPreviewOpen(true);
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(item)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCopyUrl(item)}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy URL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setMediaToDelete({ id: item.id, filename: item.filename });
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of{' '}
                    {total} files
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedMedia?.filename}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="space-y-4">
              {selectedMedia.mimeType.startsWith('image/') &&
              selectedMedia.urls?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.urls.url}
                  alt={selectedMedia.altText || selectedMedia.filename}
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center h-64 rounded-lg border bg-muted">
                  <FileIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Filename</p>
                  <p className="text-muted-foreground">{selectedMedia.filename}</p>
                </div>
                <div>
                  <p className="font-medium">Size</p>
                  <p className="text-muted-foreground">
                    {formatFileSize(selectedMedia.fileSize)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Type</p>
                  <p className="text-muted-foreground">{selectedMedia.mimeType}</p>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <p className="font-medium">Dimensions</p>
                    <p className="text-muted-foreground">
                      {selectedMedia.width} × {selectedMedia.height}
                    </p>
                  </div>
                )}
                {selectedMedia.altText && (
                  <div className="col-span-2">
                    <p className="font-medium">Alt Text</p>
                    <p className="text-muted-foreground">{selectedMedia.altText}</p>
                  </div>
                )}
                {selectedMedia.caption && (
                  <div className="col-span-2">
                    <p className="font-medium">Caption</p>
                    <p className="text-muted-foreground">{selectedMedia.caption}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setMediaToDelete({ id: selectedMedia.id, filename: selectedMedia.filename });
                    setPreviewOpen(false);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (!mediaToDelete) return;
          await handleDelete(mediaToDelete.id);
        }}
        title="Delete Media"
        description="Are you sure you want to delete this file? This action cannot be undone."
        itemName={mediaToDelete ? `"${mediaToDelete.filename}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

export default function MediaPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-muted-foreground">Loading media...</p>
          </div>
        </div>
      }
    >
      <MediaPageContent />
    </Suspense>
  );
}

