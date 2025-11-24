'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Database } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { cn } from '@/lib/utils';

interface TableColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  nullable: boolean;
  unique?: boolean;
  foreignKey?: string;
}

interface TableIndex {
  name: string;
  columns: string[];
  unique?: boolean;
}

interface Table {
  name: string;
  columns: TableColumn[];
  indexes: TableIndex[];
}

interface DatabaseSchema {
  tables: Table[];
}

export function DatabaseSchemaViewer() {
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSchema = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await api.getDatabaseSchema();
      const data = response as { success: boolean; data: DatabaseSchema };

      if (data.success) {
        setSchema(data.data);
        // Expand first table by default
        if (data.data.tables.length > 0) {
          setExpandedTables(new Set([data.data.tables[0].name]));
        }
      }

      setLoading(false);
    }, { title: 'Failed to Load Database Schema' });

    fetchSchema();
  }, [api, withErrorHandling, clearError]);

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading database schema...</p>
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

  if (!schema || schema.tables.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No schema data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {schema.tables.map((table) => {
              const isExpanded = expandedTables.has(table.name);
              return (
                <div key={table.name} className="border rounded-lg">
                  <button
                    onClick={() => toggleTable(table.name)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium font-mono">{table.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {table.columns.length} column{table.columns.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Columns</h4>
                        <div className="space-y-1">
                          {table.columns.map((column) => (
                            <div
                              key={column.name}
                              className="flex items-center gap-2 text-sm font-mono p-2 rounded bg-muted/50"
                            >
                              <span className="font-medium">{column.name}</span>
                              <span className="text-muted-foreground">{column.type}</span>
                              {column.primaryKey && (
                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  PK
                                </span>
                              )}
                              {!column.nullable && (
                                <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                                  NOT NULL
                                </span>
                              )}
                              {column.unique && (
                                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                                  UNIQUE
                                </span>
                              )}
                              {column.foreignKey && (
                                <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">
                                  FK: {column.foreignKey}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      {table.indexes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Indexes</h4>
                          <div className="space-y-1">
                            {table.indexes.map((index) => (
                              <div
                                key={index.name}
                                className="text-sm font-mono p-2 rounded bg-muted/50"
                              >
                                <span className="font-medium">{index.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  ({index.columns.join(', ')})
                                </span>
                                {index.unique && (
                                  <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded ml-2">
                                    UNIQUE
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
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

