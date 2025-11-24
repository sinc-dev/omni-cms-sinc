'use client';

import { useState, useCallback, useMemo } from 'react';
import { useFilterParams } from './use-filter-params';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'not_equals'
  | 'before'
  | 'after'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | string[] | Date | number | { from: Date; to: Date } | null;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'date-range' | 'multi-select' | 'number';
  options?: Array<{ value: string; label: string }>;
  operators?: FilterOperator[];
}

export interface FilterConfig {
  fields: FilterField[];
  defaultOperator?: FilterOperator;
}

const defaultOperators: FilterOperator[] = [
  'equals',
  'contains',
  'not_equals',
  'is_empty',
  'is_not_empty',
];

const dateOperators: FilterOperator[] = ['equals', 'before', 'after', 'between'];

/**
 * Hook for managing advanced filter state
 * Converts filter conditions to API parameters and vice versa
 */
export function useAdvancedFilters(config: FilterConfig) {
  const { updateFilters, filters } = useFilterParams();
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  // Get field definition
  const getField = useCallback(
    (fieldKey: string): FilterField | undefined => {
      return config.fields.find((f) => f.key === fieldKey);
    },
    [config.fields]
  );

  // Get available operators for a field
  const getOperators = useCallback(
    (fieldKey: string): FilterOperator[] => {
      const field = getField(fieldKey);
      if (field?.operators) {
        return field.operators;
      }
      if (field?.type === 'date' || field?.type === 'date-range') {
        return dateOperators;
      }
      return defaultOperators;
    },
    [getField]
  );

  // Add a new filter condition
  const addCondition = useCallback(() => {
    const firstField = config.fields[0];
    if (!firstField) return;

    const newCondition: FilterCondition = {
      id: `filter-${Date.now()}-${Math.random()}`,
      field: firstField.key,
      operator: config.defaultOperator || getOperators(firstField.key)[0],
      value: null,
    };
    setConditions((prev) => [...prev, newCondition]);
  }, [config, getOperators]);

  // Update a filter condition
  const updateCondition = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      setConditions((prev) =>
        prev.map((cond) => (cond.id === id ? { ...cond, ...updates } : cond))
      );
    },
    []
  );

  // Remove a filter condition
  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((cond) => cond.id !== id));
  }, []);

  // Clear all conditions
  const clearConditions = useCallback(() => {
    setConditions([]);
  }, []);

  // Convert filter conditions to API parameters
  const toApiParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};

    conditions.forEach((condition) => {
      const field = getField(condition.field);
      if (!field || !condition.value) return;

      switch (condition.operator) {
        case 'equals':
          if (typeof condition.value === 'string') {
            params[field.key] = condition.value;
          }
          break;
        case 'contains':
          if (typeof condition.value === 'string') {
            params.search = condition.value;
          }
          break;
        case 'before':
          if (condition.value instanceof Date) {
            const dateKey = `${field.key}_to`;
            params[dateKey] = condition.value.toISOString().split('T')[0];
          }
          break;
        case 'after':
          if (condition.value instanceof Date) {
            const dateKey = `${field.key}_from`;
            params[dateKey] = condition.value.toISOString().split('T')[0];
          }
          break;
        case 'between':
          if (
            typeof condition.value === 'object' &&
            'from' in condition.value &&
            'to' in condition.value
          ) {
            params[`${field.key}_from`] = condition.value.from
              .toISOString()
              .split('T')[0];
            params[`${field.key}_to`] = condition.value.to
              .toISOString()
              .split('T')[0];
          }
          break;
        case 'in':
          if (Array.isArray(condition.value)) {
            params[field.key] = condition.value.join(',');
          }
          break;
        case 'not_in':
          if (Array.isArray(condition.value)) {
            params[`${field.key}_not`] = condition.value.join(',');
          }
          break;
      }
    });

    return params;
  }, [conditions, getField]);

  // Parse API parameters to filter conditions
  const fromApiParams = useCallback(
    (params: Record<string, string>) => {
      const newConditions: FilterCondition[] = [];

      Object.entries(params).forEach(([key, value]) => {
        const field = config.fields.find((f) => f.key === key);
        if (!field) return;

        let operator: FilterOperator = 'equals';
        let filterValue: string | string[] | Date | number | { from: Date; to: Date } | null =
          value;

        // Handle date ranges
        if (key.endsWith('_from') || key.endsWith('_to')) {
          const baseKey = key.replace(/_from$|_to$/, '');
          const baseField = config.fields.find((f) => f.key === baseKey);
          if (baseField) {
            const fromValue = params[`${baseKey}_from`];
            const toValue = params[`${baseKey}_to`];
            if (fromValue && toValue) {
              operator = 'between';
              filterValue = {
                from: new Date(fromValue),
                to: new Date(toValue),
              };
            } else if (fromValue) {
              operator = 'after';
              filterValue = new Date(fromValue);
            } else if (toValue) {
              operator = 'before';
              filterValue = new Date(toValue);
            }
          }
        } else {
          // Handle regular values
          if (field.type === 'date') {
            filterValue = new Date(value);
            operator = 'equals';
          } else if (field.type === 'multi-select' && value.includes(',')) {
            operator = 'in';
            filterValue = value.split(',');
          }
        }

        newConditions.push({
          id: `filter-${Date.now()}-${Math.random()}`,
          field: field.key,
          operator,
          value: filterValue,
        });
      });

      setConditions(newConditions);
    },
    [config.fields]
  );

  // Apply filters (update URL params)
  const applyFilters = useCallback(() => {
    const apiParams = toApiParams();
    updateFilters(apiParams);
  }, [toApiParams, updateFilters]);

  // Get active filter count
  const activeCount = useMemo(() => {
    return conditions.filter((c) => c.value !== null && c.value !== '').length;
  }, [conditions]);

  return {
    conditions,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    toApiParams,
    fromApiParams,
    applyFilters,
    getField,
    getOperators,
    activeCount,
  };
}

