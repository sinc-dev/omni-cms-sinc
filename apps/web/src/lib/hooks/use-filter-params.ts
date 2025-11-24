'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface FilterParams {
  [key: string]: string | string[] | undefined;
}

/**
 * Hook to sync filters with URL query parameters
 * Provides read/write access to URL query params for filter persistence
 */
export function useFilterParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get all current filter params
  const filters = useMemo(() => {
    const params: FilterParams = {};
    searchParams.forEach((value, key) => {
      if (params[key]) {
        // Handle multiple values for the same key
        const existing = params[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing as string, value];
        }
      } else {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  // Get a single filter value
  const getFilter = useCallback(
    (key: string): string | undefined => {
      return searchParams.get(key) || undefined;
    },
    [searchParams]
  );

  // Get multiple filter values (for multi-select)
  const getFilters = useCallback(
    (key: string): string[] => {
      return searchParams.getAll(key);
    },
    [searchParams]
  );

  // Set a single filter value
  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Set multiple filter values
  const setFilters = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      values.forEach((value) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Update multiple filters at once
  const updateFilters = useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => {
            if (v && v !== 'all') {
              params.append(key, v);
            }
          });
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Clear a specific filter
  const clearFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchParams.toString().length > 0;
  }, [searchParams]);

  // Get count of active filters
  const activeFilterCount = useMemo(() => {
    return searchParams.toString().split('&').filter(Boolean).length;
  }, [searchParams]);

  return {
    filters,
    getFilter,
    getFilters,
    setFilter,
    setFilters,
    updateFilters,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}

