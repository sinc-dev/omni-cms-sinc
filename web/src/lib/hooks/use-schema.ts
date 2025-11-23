'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from './use-api-client';
import { useErrorHandler } from './use-error-handler';

interface SchemaProperty {
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

interface Schema {
  objectType: string;
  properties: SchemaProperty[];
  enums?: Record<string, { values: string[]; description: string }>;
  relationships?: Array<{ type: string; target: string; field?: string; through?: string }>;
}

interface UseSchemaResult {
  schema: Schema | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache schema for a specific object type
 */
export function useSchema(objectType: string): UseSchemaResult {
  const api = useApiClient();
  const { handleError } = useErrorHandler();
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!objectType) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await (api as any).getSchema(objectType) as { success: boolean; data: Schema };
      if (response.success) {
        setSchema(response.data);
      } else {
        throw new Error('Failed to fetch schema');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schema';
      setError(errorMessage);
      handleError(err, { title: 'Failed to fetch schema' });
    } finally {
      setLoading(false);
    }
  }, [objectType, api, handleError]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
}

