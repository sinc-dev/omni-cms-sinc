'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
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
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { MediaUploader } from '@/components/admin/media/media-uploader';

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

export default function MediaPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  let api: ReturnType<typeof useApiClient> | null = null;
  try {
    if (organization) {
      api = useApiClient();
    }
  } catch {
    api = null;
  }
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Fetch media
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchMedia = withErrorHandling(async () => {
      setLoading(true);
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

      const response = (await api.getMedia(params)) as PaginatedResponse;

      if (response.success) {
        setMedia(response.data);
        setTotal(response.meta.total);
      } else {
        handleError('Failed to load media', { title: 'Failed to Load Media' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Media' });

    fetchMedia();
  }, [organization, api, page, debouncedSearch, typeFilter, perPage, orgLoading]);

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!api || !confirm('Are you sure you want to delete this file?')) {
        return;
      }

      await withErrorHandling(async () => {
        await api.deleteMedia(mediaId);
        // Refresh media list
        setPage(1);
      }, { title: 'Failed to Delete Media' })();
    },
    [api, withErrorHandling]
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
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media by filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters and View Mode */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Type: {typeFilter === 'all' ? 'All' : typeFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('image')}>
                    Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('video')}>
                    Videos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTypeFilter('other')}>
                    Other
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedMedia(item);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Filename overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
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
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedMedia(item);
                                    setPreviewOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
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
                    handleDelete(selectedMedia.id);
                    setPreviewOpen(false);
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
    </div>
  );
}
