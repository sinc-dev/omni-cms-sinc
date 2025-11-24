'use client';

import * as React from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FilterBuilder } from './filter-builder';
import { SortSelector, type SortOption } from './sort-selector';
import { DateRangePicker } from './date-range-picker';
import { useFilterParams } from '@/lib/hooks/use-filter-params';
import type {
  FilterCondition,
  FilterField,
  FilterOperator,
} from '@/lib/hooks/use-advanced-filters';

export interface DateRangeFilter {
  key: string;
  label: string;
  value?: { from: Date | undefined; to: Date | undefined };
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export interface FilterBarProps {
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Quick filters (simple dropdown filters)
  quickFilters?: Array<{
    key: string;
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange?: (value: string) => void;
  }>;

  // Date range filters
  dateRangeFilters?: DateRangeFilter[];

  // Advanced filters
  showAdvancedFilters?: boolean;
  filterConditions?: FilterCondition[];
  filterFields?: FilterField[];
  filterOperators?: FilterOperator[];
  onAddFilterCondition?: () => void;
  onUpdateFilterCondition?: (
    id: string,
    updates: Partial<FilterCondition>
  ) => void;
  onRemoveFilterCondition?: (id: string) => void;

  // Sort
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;

  // Actions
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  quickFilters = [],
  dateRangeFilters = [],
  showAdvancedFilters = false,
  filterConditions = [],
  filterFields = [],
  filterOperators = [],
  onAddFilterCondition,
  onUpdateFilterCondition,
  onRemoveFilterCondition,
  sortOptions,
  sortValue,
  onSortChange,
  onClearAll,
  className,
}: FilterBarProps) {
  const { hasActiveFilters, activeFilterCount, clearFilters } =
    useFilterParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const handleClearAll = () => {
    clearFilters();
    onClearAll?.();
    setIsAdvancedOpen(false);
  };

  const activeQuickFilters = quickFilters.filter(
    (filter) => filter.value && filter.value !== 'all'
  );

  const activeDateRangeFilters = dateRangeFilters.filter(
    (filter) => filter.value?.from || filter.value?.to
  );

  const hasFilters =
    hasActiveFilters ||
    activeQuickFilters.length > 0 ||
    activeDateRangeFilters.length > 0 ||
    filterConditions.length > 0 ||
    searchValue;

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        {/* Search */}
        {onSearchChange && (
          <div className="flex-1 relative min-w-[200px]">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap">
          {quickFilters.map((filter) => (
            <select
              key={filter.key}
              value={filter.value || 'all'}
              onChange={(e) => filter.onChange?.(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="all">All {filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}

          {/* Date Range Filters */}
          {dateRangeFilters.map((filter) => (
            <DateRangePicker
              key={filter.key}
              dateRange={filter.value}
              onSelect={filter.onChange}
              placeholder={filter.label}
              className="h-9 min-w-[200px]"
            />
          ))}

          {/* Sort */}
          {sortOptions && sortOptions.length > 0 && (
            <SortSelector
              options={sortOptions}
              value={sortValue}
              onChange={onSortChange}
            />
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {activeQuickFilters.map((filter) => {
            const option = filter.options.find(
              (opt) => opt.value === filter.value
            );
            return (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filter.label}: {option?.label || filter.value}
                <button
                  onClick={() => filter.onChange?.('all')}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          {activeDateRangeFilters.map((filter) => {
            const formatDate = (date: Date | undefined) => {
              if (!date) return '';
              return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(date);
            };

            const displayText =
              filter.value?.from && filter.value?.to
                ? `${formatDate(filter.value.from)} - ${formatDate(filter.value.to)}`
                : filter.value?.from
                ? `From ${formatDate(filter.value.from)}`
                : filter.value?.to
                ? `Until ${formatDate(filter.value.to)}`
                : '';

            return (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {filter.label}: {displayText}
                <button
                  onClick={() => filter.onChange?.({ from: undefined, to: undefined })}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          {hasActiveFilters && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && filterFields.length > 0 && (
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <div className="mt-2">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                {isAdvancedOpen ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Hide advanced filters
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Show advanced filters
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="border rounded-md p-4 bg-muted/50">
                <FilterBuilder
                  conditions={filterConditions}
                  fields={filterFields}
                  operators={filterOperators}
                  onAddCondition={onAddFilterCondition || (() => {})}
                  onUpdateCondition={onUpdateFilterCondition || (() => {})}
                  onRemoveCondition={onRemoveFilterCondition || (() => {})}
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

