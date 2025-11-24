'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useOrganization } from './organization-context';
import { apiClient } from '@/lib/api-client';

interface SchemaMetadata {
  relationshipTypes: string[];
  fieldTypes: string[];
  colorMappings: {
    relationshipTypes: Record<string, string>;
    fieldTypes: Record<string, string>;
  };
}

interface SchemaData {
  organizationId: string;
  postTypes: unknown[];
  taxonomies: unknown[];
  standardProperties: Record<string, unknown>;
  enums: Record<string, unknown>;
  filterOperators: unknown[];
  validationRules: Record<string, unknown>;
  metadata: SchemaMetadata;
}

interface SchemaContextType {
  schema: SchemaData | null;
  isLoading: boolean;
  error: string | null;
  refreshSchema: () => Promise<void>;
  getRelationshipTypes: () => string[];
  getFieldTypes: () => string[];
  getRelationshipTypeColor: (type: string) => string;
  getFieldTypeColor: (type: string) => string;
}

const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange-600
  '#6366f1', // indigo
];

function getDefaultColor(type: string, index: number): string {
  return defaultColors[index % defaultColors.length];
}

export function SchemaProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!organization) {
      setSchema(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getSchema(organization.id);
      const data = response as { success: boolean; data: SchemaData };

      if (data.success && data.data) {
        setSchema(data.data);
      } else {
        setError('Failed to load schema');
      }
    } catch (err) {
      console.error('Error fetching schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schema');
      // Set empty schema on error to allow fallbacks
      setSchema({
        organizationId: organization.id,
        postTypes: [],
        taxonomies: [],
        standardProperties: {},
        enums: {},
        filterOperators: [],
        validationRules: {},
        metadata: {
          relationshipTypes: [],
          fieldTypes: [],
          colorMappings: {
            relationshipTypes: {},
            fieldTypes: {},
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const getRelationshipTypes = useCallback((): string[] => {
    return schema?.metadata?.relationshipTypes || [];
  }, [schema]);

  const getFieldTypes = useCallback((): string[] => {
    return schema?.metadata?.fieldTypes || [];
  }, [schema]);

  const getRelationshipTypeColor = useCallback(
    (type: string): string => {
      if (schema?.metadata?.colorMappings?.relationshipTypes?.[type]) {
        return schema.metadata.colorMappings.relationshipTypes[type];
      }
      // Fallback: generate color based on type hash
      const index = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return getDefaultColor(type, index);
    },
    [schema]
  );

  const getFieldTypeColor = useCallback(
    (type: string): string => {
      if (schema?.metadata?.colorMappings?.fieldTypes?.[type]) {
        return schema.metadata.colorMappings.fieldTypes[type];
      }
      // Fallback: generate color based on type hash
      const index = type.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return getDefaultColor(type, index);
    },
    [schema]
  );

  const refreshSchema = useCallback(async () => {
    await fetchSchema();
  }, [fetchSchema]);

  return (
    <SchemaContext.Provider
      value={{
        schema,
        isLoading,
        error,
        refreshSchema,
        getRelationshipTypes,
        getFieldTypes,
        getRelationshipTypeColor,
        getFieldTypeColor,
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchema() {
  const context = useContext(SchemaContext);
  if (context === undefined) {
    throw new Error('useSchema must be used within a SchemaProvider');
  }
  return context;
}

