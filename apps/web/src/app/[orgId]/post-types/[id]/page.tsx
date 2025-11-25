'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Layers } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrgUrl } from '@/lib/hooks/use-org-url';
import { FieldList } from '@/components/post-types/field-list';
import { FieldAttachmentDialog } from '@/components/post-types/field-attachment-dialog';

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

interface PostTypeField {
  id: string;
  postTypeId: string;
  customFieldId: string;
  isRequired: boolean;
  defaultValue?: string | null;
  order: number;
  createdAt: string;
  customField: {
    id: string;
    name: string;
    slug: string;
    fieldType: string;
    settings?: string | null;
  };
}

export default function PostTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postTypeId = params.id as string;
  const { getUrl } = useOrgUrl();
  const { organization, isLoading: orgLoading } = useOrganization();
  // Always call hooks unconditionally - React rules
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [postType, setPostType] = useState<PostType | null>(null);
  const [fields, setFields] = useState<PostTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);

  // Fetch post type and fields
  useEffect(() => {
    if (!organization || orgLoading) {
      return;
    }

    const fetchData = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const [postTypeResponse, fieldsResponse] = await Promise.all([
        api.getPostType(postTypeId),
        api.getPostTypeFields(postTypeId),
      ]);

      const postTypeData = postTypeResponse as { success: boolean; data: PostType };
      const fieldsData = fieldsResponse as { success: boolean; data: PostTypeField[] };

      if (postTypeData.success) {
        setPostType(postTypeData.data);
      }

      if (fieldsData.success) {
        setFields(fieldsData.data);
      }

      // Fetch post count (optional - you might want to add this endpoint)
      try {
        const postsResponse = await api.getPosts({ post_type: postTypeId });
        const postsData = postsResponse as { success: boolean; meta?: { total: number } };
        if (postsData.success && postsData.meta) {
          setPostCount(postsData.meta.total);
        }
      } catch {
        // Ignore if endpoint doesn't support this
      }

      setLoading(false);
    }, { title: 'Failed to Load Post Type' });

    fetchData();
  }, [organization, api, postTypeId, orgLoading, withErrorHandling, clearError]);

  const handleFieldDetach = withErrorHandling(async (fieldId: string) => {
    if (!api) return;

    await api.detachFieldFromPostType(postTypeId, fieldId);
    
    // Refresh fields
    const fieldsResponse = await api.getPostTypeFields(postTypeId);
    const fieldsData = fieldsResponse as { success: boolean; data: PostTypeField[] };
    if (fieldsData.success) {
      setFields(fieldsData.data);
    }
  }, { title: 'Failed to Detach Field' });

  const handleFieldReorder = withErrorHandling(async (fieldOrders: Array<{ fieldId: string; order: number }>) => {
    if (!api) return;

    await api.updateFieldOrder(postTypeId, fieldOrders);
    
    // Refresh fields
    const fieldsResponse = await api.getPostTypeFields(postTypeId);
    const fieldsData = fieldsResponse as { success: boolean; data: PostTypeField[] };
    if (fieldsData.success) {
      setFields(fieldsData.data);
    }
  }, { title: 'Failed to Reorder Fields' });

  const handleFieldAttached = () => {
    setAttachmentDialogOpen(false);
    // Refresh fields
    if (api) {
      api.getPostTypeFields(postTypeId).then((response) => {
        const fieldsData = response as { success: boolean; data: PostTypeField[] };
        if (fieldsData.success) {
          setFields(fieldsData.data);
        }
      });
    }
  };

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view post type details.'}
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
            <p className="text-sm text-muted-foreground">Loading post type details...</p>
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
              <Link href={getUrl('post-types')}>Back to Post Types</Link>
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
            <Link href={getUrl('post-types')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{postType.name}</h1>
            <p className="text-muted-foreground">
              {postType.slug} {postType.isHierarchical && '• Hierarchical'}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={getUrl(`post-types/${postTypeId}/edit`)}>
            <Settings className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Post Type Info */}
      <Card>
        <CardHeader>
          <CardTitle>Post Type Information</CardTitle>
          <CardDescription>Basic information about this post type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-sm">{postType.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Slug</label>
            <p className="text-sm font-mono">{postType.slug}</p>
          </div>
          {postType.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{postType.description}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Hierarchical</label>
            <p className="text-sm">{postType.isHierarchical ? 'Yes' : 'No'}</p>
          </div>
          {postCount !== null && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Posts</label>
              <p className="text-sm">{postCount} post{postCount !== 1 ? 's' : ''}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fields Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Attached Fields
              </CardTitle>
              <CardDescription>
                Manage custom fields attached to this post type
              </CardDescription>
            </div>
            <FieldAttachmentDialog
              postTypeId={postTypeId}
              open={attachmentDialogOpen}
              onOpenChange={setAttachmentDialogOpen}
              onAttached={handleFieldAttached}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <FieldList
            fields={fields}
            onDetach={handleFieldDetach}
            onReorder={handleFieldReorder}
          />
        </CardContent>
      </Card>
    </div>
  );
}

