'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
// Optimized: Direct icon imports to reduce bundle size
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrgUrl } from '@/lib/hooks/use-org-url';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormErrorSummary,
  useFormState,
  Input,
  Textarea,
} from '@/components/form-wrappers';
import { editPostTypeFormSchema } from '@/lib/validations/post-type';
import type { EditPostTypeFormInput } from '@/lib/validations/post-type';

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
  const { getUrl } = useOrgUrl();
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [postType, setPostType] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<EditPostTypeFormInput | null>(null);

  // Fetch guards to prevent infinite loops and redundant API calls
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch post type
  useEffect(() => {
    if (!organization || orgLoading) {
      return;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Early return if already fetched for this post type
    if (hasFetchedRef.current && postType?.id === postTypeId) {
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchPostType = withErrorHandling(async () => {
      isFetchingRef.current = true;
      setLoading(true);
      clearError();

      try {
        const response = await api.getPostType(postTypeId);
        
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        const data = response as { success: boolean; data: PostType };

        if (data.success) {
          setPostType(data.data);
          setDefaultValues({
            name: data.data.name,
            slug: data.data.slug,
            description: data.data.description || '',
            icon: data.data.icon || '',
            isHierarchical: data.data.isHierarchical,
          });
          hasFetchedRef.current = true;
        }
      } catch (err) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        // Error is handled by withErrorHandling
        throw err;
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, { title: 'Failed to Load Post Type' });

    fetchPostType();

    // Cleanup: Abort request on unmount or when dependencies change
    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, postTypeId]);

  const handleSubmit = withErrorHandling(async (data: EditPostTypeFormInput) => {
    clearError();

    try {
      await api.updatePostType(postTypeId, {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        isHierarchical: data.isHierarchical,
      });

      // Redirect to detail page
      router.push(getUrl(`post-types/${postTypeId}`));
    } catch (err) {
      handleError(err, { title: 'Failed to Update Post Type' });
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

  if (loading || !defaultValues) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
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
            <Link href={getUrl(`post-types/${postTypeId}`)}>
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

      <Form
        schema={editPostTypeFormSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        mode="onBlur"
      >
        <PostTypeEditFormContent postTypeId={postTypeId} />
      </Form>
    </div>
  );
}

function PostTypeEditFormContent({ postTypeId }: { postTypeId: string }) {
  const { getUrl } = useOrgUrl();
  const { form, isSubmitting, isValid, errors } = useFormState<EditPostTypeFormInput>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post Type Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField name="name">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="name">
                Name
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="name"
                  placeholder="e.g., Blog Post, Product, Page"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="slug">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="slug">
                Slug
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="slug"
                  placeholder="blog-post"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormDescription>
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </FormDescription>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="description">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="description">
                Description
              </FormLabel>
              <FormControl error={invalid}>
                <Textarea
                  id="description"
                  placeholder="A brief description of this post type"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  rows={3}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="icon">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="icon">
                Icon (optional)
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="icon"
                  placeholder="e.g., file-text, image, video"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormDescription>
                Icon name from Lucide icons library
              </FormDescription>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="isHierarchical">
          {({ value, onChange, error, invalid }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hierarchical"
                  checked={Boolean(value)}
                  onCheckedChange={(checked: boolean) => onChange(checked === true)}
                />
                <FormLabel
                  htmlFor="hierarchical"
                  className="text-sm font-normal cursor-pointer"
                  error={invalid}
                >
                  Hierarchical (supports parent-child relationships like pages)
                </FormLabel>
              </div>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormErrorSummary errors={errors as Record<string, { message?: string }>} />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" asChild>
            <Link href={getUrl(`post-types/${postTypeId}`)}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !isValid}>
            {isSubmitting ? (
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
  );
}

