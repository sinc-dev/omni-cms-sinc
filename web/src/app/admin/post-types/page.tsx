'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { cn } from '@/lib/utils';

interface PostType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  isHierarchical: boolean;
  settings?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  success: boolean;
  data: PostType[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export default function PostTypesPage() {
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
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPostType, setEditingPostType] = useState<PostType | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isHierarchical, setIsHierarchical] = useState(false);

  // Generate slug from name
  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch post types
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchPostTypes = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {};
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = (await api.getPostTypes()) as PaginatedResponse;

      if (response.success) {
        setPostTypes(response.data);
      } else {
        handleError('Failed to load post types', { title: 'Failed to Load Post Types' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Post Types' });

    fetchPostTypes();
  }, [organization, api, debouncedSearch, orgLoading, withErrorHandling, clearError, handleError]);

  const handleSave = withErrorHandling(async () => {
    if (!api || !name) return;

    setSaving(true);
    clearError();

    const finalSlug = slug || generateSlug(name);
    const data = {
      name,
      slug: finalSlug,
      description: description || undefined,
      icon: icon || undefined,
      isHierarchical,
    };

    if (editingPostType) {
      await api.updatePostType(editingPostType.id, data);
    } else {
      await api.createPostType(data);
    }

    // Reset form and close dialog
    closeDialog();

    // Refresh post types list
    setPostTypes([]);
    setSaving(false);
  }, { title: 'Failed to Save Post Type' });

  const handleDelete = withErrorHandling(async (postType: PostType) => {
    if (!api || !confirm(`Are you sure you want to delete "${postType.name}"? This will also delete all posts of this type.`)) {
      return;
    }

    await api.deletePostType(postType.id);
    // Refresh post types list
    setPostTypes([]);
  }, { title: 'Failed to Delete Post Type' });

  const openEditDialog = (postType: PostType) => {
    setEditingPostType(postType);
    setName(postType.name);
    setSlug(postType.slug);
    setDescription(postType.description || '');
    setIcon(postType.icon || '');
    setIsHierarchical(postType.isHierarchical);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPostType(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('');
    setIsHierarchical(false);
    clearError();
  };

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view post types.'}
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
          <h1 className="text-3xl font-bold tracking-tight">Post Types</h1>
          <p className="text-muted-foreground">Define content structures</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Post Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPostType ? 'Edit Post Type' : 'Create Post Type'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Blog Post, Product, Page"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug && !editingPostType) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="blog-post"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs. Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="A brief description of this post type"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (optional)</Label>
                <Input
                  id="icon"
                  placeholder="e.g., file-text, image, video"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Icon name from Lucide icons library
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hierarchical"
                  checked={isHierarchical}
                  onCheckedChange={(checked: boolean) =>
                    setIsHierarchical(checked === true)
                  }
                />
                <Label
                  htmlFor="hierarchical"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hierarchical (supports parent-child relationships like pages)
                </Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !name || !slug}
                >
                  {saving ? 'Saving...' : editingPostType ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search post types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading post types...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && postTypes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No post types match your search.'
                  : 'No post types yet. Create your first post type to define content structure.'}
              </p>
            </div>
          )}

          {!loading && !error && postTypes.length > 0 && (
            <div className="space-y-2">
              {postTypes.map((postType) => (
                <div
                  key={postType.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {postType.icon ? (
                        <span className="text-lg">{postType.icon}</span>
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{postType.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {postType.slug} {postType.isHierarchical && '• Hierarchical'}
                      </div>
                      {postType.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {postType.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(postType)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(postType)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
