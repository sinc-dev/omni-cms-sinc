'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from './use-api-client';
import { useErrorHandler } from './use-error-handler';

interface PostTypeSchemaProperty {
  name: string;
  label: string;
  type: string;
  required: boolean;
  readOnly?: boolean;
  enum?: string[];
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    maxLength?: number;
  };
  default?: string | number | boolean;
  description?: string;
}

interface PostTypeInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isHierarchical: boolean;
  settings: Record<string, unknown> | null;
}

interface PostTypeSchema {
  objectType: string;
  postType: PostTypeInfo;
  properties: PostTypeSchemaProperty[];
  enums?: Record<string, { values: string[]; description: string }>;
  relationships?: Array<{ type: string; target: string; field?: string; through?: string }>;
}

interface UsePostTypeSchemaResult {
  schema: PostTypeSchema | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache schema for a specific post type
 * Includes standard post properties plus custom fields
 */
export function usePostTypeSchema(postTypeId: string | null): UsePostTypeSchemaResult {
  const api = useApiClient();
  const { handleError } = useErrorHandler();
  const [schema, setSchema] = useState<PostTypeSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!postTypeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await (api as any).getPostTypeSchema(postTypeId) as { success: boolean; data: PostTypeSchema };
      if (response.success) {
        setSchema(response.data);
      } else {
        throw new Error('Failed to fetch post type schema');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch post type schema';
      setError(errorMessage);
      handleError(err, { title: 'Failed to fetch post type schema' });
    } finally {
      setLoading(false);
    }
  }, [postTypeId, api, handleError]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
}

