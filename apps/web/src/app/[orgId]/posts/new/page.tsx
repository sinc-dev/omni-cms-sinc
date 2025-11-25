'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgUrl } from '@/lib/hooks/use-org-url';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Eye, Loader2, ExternalLink } from 'lucide-react';
import { TipTapEditor } from '@/components/editor/tiptap-editor';
import { CustomFieldRenderer } from '@/components/editor/custom-field-renderer';
import { MediaPicker } from '@/components/editor/media-picker';
import { TaxonomySelector } from '@/components/editor/taxonomy-selector';
import { AutoSaveIndicator } from '@/components/editor/auto-save-indicator';
import { RelationshipList } from '@/components/posts/relationship-list';
import { RelationshipSelector } from '@/components/posts/relationship-selector';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useAutoSave, useAutoSaveTrigger } from '@/lib/hooks/use-auto-save';
import { useSchema } from '@/lib/hooks/use-schema';
import { usePostTypeSchema } from '@/lib/hooks/use-post-type-schema';

interface PostType {
  id: string;
  name: string;
  slug: string;
}

interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  settings?: string | null;
}

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  isHierarchical: boolean;
  terms?: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
}

export default function NewPostPage() {
  const router = useRouter();
  const { getUrl } = useOrgUrl();
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();

  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [postId, setPostId] = useState<string | null>(null); // Track created post ID for auto-save

  // Get schema for posts to get status enum values
  const { schema: postsSchema, loading: postsSchemaLoading, error: postsSchemaError } = useSchema('posts');
  
  // Get schema for selected post type to get custom fields
  const [postTypeId, setPostTypeId] = useState<string>('');
  const { schema: postTypeSchema, loading: postTypeSchemaLoading, error: postTypeSchemaError } = usePostTypeSchema(postTypeId);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  
  // Get status enum values from schema, default to 'draft'
  const statusProperty = postsSchema?.properties?.find(p => p.name === 'status');
  const statusOptions = statusProperty?.options || [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];
  const [status, setStatus] = useState<string>('draft');
  
  // Update status when schema loads with default value (only if schema provides a different default)
  useEffect(() => {
    if (postsSchema && statusProperty?.default && statusProperty.default !== 'draft' && status === 'draft') {
      // Only update if still at initial default and schema provides a different default
      setStatus(statusProperty.default as string);
    }
  }, [postsSchema, statusProperty, status]);
  const [scheduledPublishAt, setScheduledPublishAt] = useState<string>('');
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [taxonomyValues, setTaxonomyValues] = useState<Record<string, string[]>>({});

  // Load custom fields from post type schema when post type changes
  useEffect(() => {
    if (postTypeSchema?.properties) {
      // Filter properties to only custom fields (not standard post properties)
      const standardPropertyNames = ['id', 'title', 'slug', 'content', 'excerpt', 'status', 'workflowStatus', 
        'publishedAt', 'scheduledPublishAt', 'metaTitle', 'metaDescription', 'metaKeywords', 'canonicalUrl',
        'viewCount', 'shareCount', 'createdAt', 'updatedAt'];
      const customFieldProperties = postTypeSchema.properties.filter(
        p => !standardPropertyNames.includes(p.name)
      );
      
      // Convert schema properties to CustomField format
      const fields: CustomField[] = customFieldProperties.map(prop => ({
        id: prop.name, // Use slug as ID for now
        name: prop.label,
        slug: prop.name,
        fieldType: prop.type,
        settings: prop.validation ? JSON.stringify(prop.validation) : null,
      }));
      
      setCustomFields(fields);
    } else {
      setCustomFields([]);
    }
  }, [postTypeSchema]);

  // Generate slug from name
  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Fetch post types and taxonomies
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch post types
        const postTypesResponse = (await api.getPostTypes()) as {
          success: boolean;
          data: PostType[];
        };
        if (postTypesResponse.success && postTypesResponse.data.length > 0) {
          setPostTypes(postTypesResponse.data);
          setPostTypeId(postTypesResponse.data[0].id);
        }

        // Fetch taxonomies
        const taxonomiesResponse = (await api.getTaxonomies()) as {
          success: boolean;
          data: Taxonomy[];
        };
        if (taxonomiesResponse.success) {
          setTaxonomies(taxonomiesResponse.data);
          // Load terms for each taxonomy
          const taxonomiesWithTerms = await Promise.all(
            taxonomiesResponse.data.map(async (taxonomy) => {
              try {
                const termsResponse = (await api.getTaxonomyTerms(taxonomy.id)) as {
                  success: boolean;
                  data: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
                };
                return {
                  ...taxonomy,
                  terms: termsResponse.success ? termsResponse.data : [],
                };
              } catch {
                return { ...taxonomy, terms: [] };
              }
            })
          );
          setTaxonomies(taxonomiesWithTerms);
        }

        // Custom fields will be loaded from post type schema when postTypeId is selected
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organization, api, orgLoading]);

  // Update custom field value
  const updateCustomField = (fieldSlug: string, value: unknown) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldSlug]: value,
    }));
  };

  // Update taxonomy selection
  const updateTaxonomy = (taxonomySlug: string, termIds: string[]) => {
    setTaxonomyValues((prev) => ({
      ...prev,
      [taxonomySlug]: termIds,
    }));
  };

  // Auto-save function
  const performAutoSave = async () => {
    if (!api || !postTypeId || !title || !slug) {
      return; // Don't auto-save if required fields are missing
    }

    try {
      // Prepare custom fields data
      const customFieldsData: Record<string, unknown> = {};
      customFields.forEach((field) => {
        const value = customFieldValues[field.slug];
        if (value !== undefined && value !== null && value !== '') {
          customFieldsData[field.slug] = value;
        }
      });

      // Prepare taxonomies data
      const taxonomiesData: Record<string, string[]> = {};
      Object.keys(taxonomyValues).forEach((taxonomySlug) => {
        const termIds = taxonomyValues[taxonomySlug];
        if (termIds && termIds.length > 0) {
          taxonomiesData[taxonomySlug] = termIds;
        }
      });

      if (postId) {
        // Update existing post
        await api.updatePost(postId, {
          title,
          slug,
          content: content || null,
          excerpt: excerpt || null,
          scheduledPublishAt: scheduledPublishAt || null,
          featuredImageId: featuredImageId || null,
          customFields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
          taxonomies: Object.keys(taxonomiesData).length > 0 ? taxonomiesData : undefined,
          autoSave: true, // Mark as auto-save
        });
      } else {
        // Create new post as draft
        const response =         await api.createPost({
          postTypeId,
          title,
          slug,
          content: content || null,
          excerpt: excerpt || null,
          status: 'draft', // Always draft on auto-save
          scheduledPublishAt: scheduledPublishAt || null,
          featuredImageId: featuredImageId || null,
          customFields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
          taxonomies: Object.keys(taxonomiesData).length > 0 ? taxonomiesData : undefined,
          autoSave: true, // Mark as auto-save
        }) as { success: boolean; data: { id: string } };

        if (response.success && response.data?.id) {
          setPostId(response.data.id);
        }
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      throw err; // Let the hook handle retry
    }
  };

  // Set up auto-save
  const autoSave = useAutoSave({
    onSave: performAutoSave,
    debounceMs: 2500,
    enabled: !!api && !!postTypeId && !!title && !!slug,
  });

  // Trigger auto-save on form changes
  useAutoSaveTrigger(autoSave, [
    title,
    slug,
    content,
    excerpt,
    featuredImageId,
    customFieldValues,
    taxonomyValues,
  ]);

  const handleSubmit = withErrorHandling(async (forceDraft = false) => {
    if (!api || !postTypeId || !title || !slug) {
      handleError('Please fill in all required fields', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      // Prepare custom fields data
      const customFieldsData: Record<string, unknown> = {};
      customFields.forEach((field) => {
        const value = customFieldValues[field.slug];
        if (value !== undefined && value !== null && value !== '') {
          customFieldsData[field.slug] = value;
        }
      });

      // Prepare taxonomies data
      const taxonomiesData: Record<string, string[]> = {};
      Object.keys(taxonomyValues).forEach((taxonomySlug) => {
        const termIds = taxonomyValues[taxonomySlug];
        if (termIds && termIds.length > 0) {
          taxonomiesData[taxonomySlug] = termIds;
        }
      });

      const finalStatus = forceDraft ? 'draft' : status;

      if (postId) {
        // Update existing post
        await api.updatePost(postId, {
          title,
          slug,
          content: content || null,
          excerpt: excerpt || null,
          status: finalStatus,
          scheduledPublishAt: scheduledPublishAt || null,
          featuredImageId: featuredImageId || null,
          customFields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
          taxonomies: Object.keys(taxonomiesData).length > 0 ? taxonomiesData : undefined,
        });
      } else {
        // Create new post
        const response = await api.createPost({
          postTypeId,
          title,
          slug,
          content: content || null,
          excerpt: excerpt || null,
          status: finalStatus,
          scheduledPublishAt: scheduledPublishAt || null,
          featuredImageId: featuredImageId || null,
          customFields: Object.keys(customFieldsData).length > 0 ? customFieldsData : undefined,
          taxonomies: Object.keys(taxonomiesData).length > 0 ? taxonomiesData : undefined,
        }) as { success: boolean; data: { id: string } };

        if (response.success && response.data?.id) {
          setPostId(response.data.id);
        }
      }

      router.push(getUrl('posts'));
      setSaving(false);
    } catch (err) {
      handleError(err, { title: 'Failed to Save Post' });
      setSaving(false);
      throw err; // Re-throw to allow withErrorHandling to handle it
    }
  }, { title: 'Failed to Save Post' });

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to create a post.'}
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
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={getUrl('posts')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Post</h1>
            <p className="text-muted-foreground">Add a new post to your content library</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AutoSaveIndicator
            status={autoSave.status}
            lastSavedAt={autoSave.lastSavedAt}
          />
          <div className="flex items-center gap-2">
            {postId && status === 'published' && organization && slug && (
              <Button
                variant="outline"
                onClick={() => {
                  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                  const previewUrl = `${baseUrl}/api/public/v1/${organization.slug}/posts/${slug}`;
                  window.open(previewUrl, '_blank');
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </div>
      </div>

      {(error || postsSchemaError || postTypeSchemaError) && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error || postsSchemaError || postTypeSchemaError || 'An error occurred'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {postTypes.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="postType">Post Type *</Label>
                  <select
                    id="postType"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={postTypeId}
                    onChange={(e) => setPostTypeId(e.target.value)}
                    aria-label="Post Type"
                    title="Post Type"
                  >
                    <option value="">Select post type...</option>
                    {postTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="post-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the post"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your post..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {postTypeId && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {postTypeSchemaLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading custom fields...</span>
                  </div>
                ) : postTypeSchemaError ? (
                  <p className="text-sm text-destructive">Failed to load custom fields: {postTypeSchemaError}</p>
                ) : customFields.length > 0 ? (
                  customFields.map((field) => (
                    <CustomFieldRenderer
                      key={field.id}
                      field={field}
                      value={customFieldValues[field.slug]}
                      onChange={(value) => updateCustomField(field.slug, value)}
                      postTypeId={postTypeId}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No custom fields available for this post type.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Taxonomies */}
          {taxonomies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Taxonomies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {taxonomies.map((taxonomy) => (
                  <TaxonomySelector
                    key={taxonomy.id}
                    taxonomy={taxonomy}
                    selectedTermIds={taxonomyValues[taxonomy.slug] || []}
                    onChange={(termIds) => updateTaxonomy(taxonomy.slug, termIds)}
                    onCreateTerm={async (termData) => {
                      try {
                        const response = (await api.createTaxonomyTerm(taxonomy.id, {
                          name: termData.name,
                          slug: termData.slug,
                        })) as {
                          success: boolean;
                          data: { id: string; name: string; slug: string };
                        };
                        if (response.success && response.data) {
                          // Refresh terms for this taxonomy
                          const termsResponse = (await api.getTaxonomyTerms(taxonomy.id)) as {
                            success: boolean;
                            data: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
                          };
                          if (termsResponse.success) {
                            setTaxonomies((prev) =>
                              prev.map((t) =>
                                t.id === taxonomy.id
                                  ? { ...t, terms: termsResponse.data }
                                  : t
                              )
                            );
                          }
                          return response.data;
                        }
                        return null;
                      } catch (err) {
                        console.error('Failed to create term:', err);
                        return null;
                      }
                    }}
                    onRefreshTerms={async () => {
                      const termsResponse = (await api.getTaxonomyTerms(taxonomy.id)) as {
                        success: boolean;
                        data: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
                      };
                      if (termsResponse.success) {
                        setTaxonomies((prev) =>
                          prev.map((t) =>
                            t.id === taxonomy.id
                              ? { ...t, terms: termsResponse.data }
                              : t
                          )
                        );
                      }
                    }}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                {postsSchemaLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading status options...
                  </div>
                ) : (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={postsSchemaLoading}
                    aria-label="Status"
                    title="Status"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledPublishAt">Schedule Publish (Optional)</Label>
                <Input
                  id="scheduledPublishAt"
                  type="datetime-local"
                  value={scheduledPublishAt}
                  onChange={(e) => setScheduledPublishAt(e.target.value)}
                  className="w-full"
                />
                {scheduledPublishAt && (
                  <p className="text-xs text-muted-foreground">
                    Will be published at: {new Date(scheduledPublishAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={() => handleSubmit(false)} disabled={saving || !postTypeId || !title || !slug}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : scheduledPublishAt ? (
                  'Schedule'
                ) : status === 'published' ? (
                  'Publish'
                ) : (
                  'Save'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaPicker
                value={featuredImageId}
                onChange={setFeaturedImageId}
              />
            </CardContent>
          </Card>

          {postId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Relationships</CardTitle>
                  <RelationshipSelector
                    fromPostId={postId}
                    onRelationshipCreated={() => {
                      // Relationships will refresh automatically
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <RelationshipList postId={postId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

