'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

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

export default function EditPostTypePage() {
  const params = useParams();
  const router = useRouter();
  const postTypeId = params.id as string;
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [postType, setPostType] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [isHierarchical, setIsHierarchical] = useState(false);

  // Fetch post type
  useEffect(() => {
    if (!organization || orgLoading) {
      return;
    }

    const fetchPostType = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await api.getPostType(postTypeId);
      const data = response as { success: boolean; data: PostType };

      if (data.success) {
        setPostType(data.data);
        setName(data.data.name);
        setSlug(data.data.slug);
        setDescription(data.data.description || '');
        setIcon(data.data.icon || '');
        setIsHierarchical(data.data.isHierarchical);
      }

      setLoading(false);
    }, { title: 'Failed to Load Post Type' });

    fetchPostType();
  }, [organization, api, postTypeId, orgLoading, withErrorHandling, clearError]);

  const handleSubmit = withErrorHandling(async () => {
    if (!name || !slug) {
      handleError('Name and slug are required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      await api.updatePostType(postTypeId, {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        isHierarchical,
      });

      // Redirect to detail page
      router.push(`/admin/post-types/${postTypeId}`);
    } catch (err) {
      handleError(err, { title: 'Failed to Update Post Type' });
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Update Post Type' });

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to edit post type.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!postType) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Post type not found.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/post-types">Back to Post Types</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/post-types/${postTypeId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Post Type</h1>
            <p className="text-muted-foreground">
              Update post type settings
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Post Type Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blog Post, Product, Page"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <Textarea
              id="description"
              placeholder="A brief description of this post type"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" asChild>
              <Link href={`/admin/post-types/${postTypeId}`}>Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !name || !slug}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Post Type
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

