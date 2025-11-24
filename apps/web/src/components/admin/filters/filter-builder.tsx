'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterConditionComponent } from './filter-condition';
import type {
  FilterCondition,
  FilterField,
  FilterOperator,
} from '@/lib/hooks/use-advanced-filters';

export interface FilterBuilderProps {
  conditions: FilterCondition[];
  fields: FilterField[];
  operators: FilterOperator[];
  onAddCondition: () => void;
  onUpdateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  onRemoveCondition: (id: string) => void;
  className?: string;
}

export function FilterBuilder({
  conditions,
  fields,
  operators,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
  className,
}: FilterBuilderProps) {
  return (
    <div className={className}>
      <div className="space-y-2">
        {conditions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No filters applied. Click "Add filter" to get started.
          </div>
        ) : (
          conditions.map((condition) => (
            <FilterConditionComponent
              key={condition.id}
              condition={condition}
              fields={fields}
              operators={operators}
              onUpdate={(updates) =>
                onUpdateCondition(condition.id, updates)
              }
              onRemove={() => onRemoveCondition(condition.id)}
            />
          ))
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAddCondition}
        className="mt-2"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add filter
      </Button>
    </div>
  );
}

