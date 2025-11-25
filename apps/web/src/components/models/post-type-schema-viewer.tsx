'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, FolderTree, Layers } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useSchema } from '@/lib/context/schema-context';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface PostType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isHierarchical: boolean;
}

interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  settings?: string | null;
}

interface PostTypeField {
  id: string;
  customFieldId: string;
  isRequired: boolean;
  defaultValue?: string | null;
  order: number;
  customField: CustomField;
}

export function PostTypeSchemaViewer() {
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { getFieldTypeColor } = useSchema();
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [fieldsMap, setFieldsMap] = useState<Record<string, PostTypeField[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await api.getPostTypes();
      const data = response as { success: boolean; data: PostType[] };

      if (data.success) {
        setPostTypes(data.data);
        // Expand first post type by default
        if (data.data.length > 0) {
          setExpandedTypes(new Set([data.data[0].id]));
        }

        // Fetch fields for each post type
        const fieldsPromises = data.data.map(async (postType) => {
          try {
            const fieldsResponse = await api.getPostTypeFields(postType.id);
            const fieldsData = fieldsResponse as { success: boolean; data: PostTypeField[] };
            return { postTypeId: postType.id, fields: fieldsData.success ? fieldsData.data : [] };
          } catch {
            return { postTypeId: postType.id, fields: [] };
          }
        });

        const fieldsResults = await Promise.all(fieldsPromises);
        const newFieldsMap: Record<string, PostTypeField[]> = {};
        fieldsResults.forEach(({ postTypeId, fields }) => {
          newFieldsMap[postTypeId] = fields;
        });
        setFieldsMap(newFieldsMap);
      }

      setLoading(false);
    }, { title: 'Failed to Load Post Types' });

    fetchData();
  }, [api, withErrorHandling, clearError]);

  const togglePostType = (postTypeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(postTypeId)) {
      newExpanded.delete(postTypeId);
    } else {
      newExpanded.add(postTypeId);
    }
    setExpandedTypes(newExpanded);
  };

  const getFieldTypeBadgeColor = (fieldType: string) => {
    // Convert hex color to Tailwind classes
    const hexColor = getFieldTypeColor(fieldType);
    // Map common hex colors to Tailwind classes
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      '#10b981': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      '#f59e0b': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#ef4444': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      '#8b5cf6': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      '#ec4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      '#06b6d4': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      '#84cc16': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      '#f97316': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#6366f1': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colorMap[hexColor] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading post type schemas...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (postTypes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No post types found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Post Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {postTypes.map((postType) => {
              const isExpanded = expandedTypes.has(postType.id);
              const fields = fieldsMap[postType.id] || [];
              const sortedFields = [...fields].sort((a, b) => a.order - b.order);

              return (
                <div key={postType.id} className="border rounded-lg">
                  <div className="flex items-center gap-2 p-3">
                    <button
                      onClick={() => togglePostType(postType.id)}
                      className="flex items-center gap-2 hover:bg-muted/50 transition-colors rounded p-1 -ml-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/post-types/${postType.id}`}
                      className="flex-1 flex items-center gap-2 hover:underline"
                    >
                      <span className="font-medium">{postType.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {postType.slug}
                      </span>
                      {postType.isHierarchical && (
                        <Badge variant="secondary" className="text-xs">
                          Hierarchical
                        </Badge>
                      )}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {sortedFields.length} field{sortedFields.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="border-t p-4 space-y-2">
                      {postType.description && (
                        <p className="text-sm text-muted-foreground mb-3">{postType.description}</p>
                      )}
                      {sortedFields.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No fields attached.</p>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Attached Fields
                          </h4>
                          {sortedFields.map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center gap-2 p-2 rounded bg-muted/50"
                            >
                              <span className="font-medium text-sm">{field.customField.name}</span>
                              <Badge className={getFieldTypeBadgeColor(field.customField.fieldType)}>
                                {field.customField.fieldType}
                              </Badge>
                              {field.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground font-mono ml-auto">
                                {field.customField.slug}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

