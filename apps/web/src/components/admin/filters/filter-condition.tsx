'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRangePicker } from './date-range-picker';
import type { FilterCondition, FilterField, FilterOperator } from '@/lib/hooks/use-advanced-filters';

export interface FilterConditionProps {
  condition: FilterCondition;
  fields: FilterField[];
  operators: FilterOperator[];
  onUpdate: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: 'equals',
  contains: 'contains',
  not_equals: 'does not equal',
  before: 'is before',
  after: 'is after',
  between: 'is between',
  in: 'is one of',
  not_in: 'is not one of',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export function FilterConditionComponent({
  condition,
  fields,
  operators,
  onUpdate,
  onRemove,
}: FilterConditionProps) {
  const field = fields.find((f) => f.key === condition.field);
  const availableOperators = operators.filter((op) => {
    if (field?.operators) {
      return field.operators.includes(op);
    }
    return true;
  });

  const handleFieldChange = (fieldKey: string) => {
    const newField = fields.find((f) => f.key === fieldKey);
    if (!newField) return;

    // Reset operator and value when field changes
    const defaultOperators = newField.operators || operators;
    onUpdate({
      field: fieldKey,
      operator: defaultOperators[0],
      value: null,
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    // Reset value for operators that don't need values
    if (operator === 'is_empty' || operator === 'is_not_empty') {
      onUpdate({ operator, value: null });
    } else {
      onUpdate({ operator });
    }
  };

  const renderValueInput = () => {
    if (!field) return null;

    // Operators that don't need values
    if (
      condition.operator === 'is_empty' ||
      condition.operator === 'is_not_empty'
    ) {
      return null;
    }

    // Date range picker
    if (condition.operator === 'between' && field.type === 'date') {
      const range =
        condition.value && typeof condition.value === 'object' && 'from' in condition.value
          ? condition.value
          : { from: undefined, to: undefined };
      return (
        <DateRangePicker
          dateRange={range}
          onSelect={(range) => onUpdate({ value: range })}
        />
      );
    }

    // Single date picker
    if (
      (condition.operator === 'before' ||
        condition.operator === 'after' ||
        condition.operator === 'equals') &&
      field.type === 'date'
    ) {
      const date =
        condition.value instanceof Date ? condition.value : undefined;
      return (
        <DatePicker
          date={date}
          onSelect={(date) => onUpdate({ value: date || null })}
        />
      );
    }

    // Multi-select
    if (
      (condition.operator === 'in' || condition.operator === 'not_in') &&
      field.options
    ) {
      const selectedValues = Array.isArray(condition.value)
        ? condition.value
        : condition.value
        ? [condition.value.toString()]
        : [];
      return (
        <Select
          value={selectedValues[0] || ''}
          onValueChange={(value) => {
            // For now, single select - can be enhanced for multi-select
            onUpdate({ value: [value] });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Select dropdown
    if (field.type === 'select' && field.options) {
      return (
        <Select
          value={
            typeof condition.value === 'string' ? condition.value : ''
          }
          onValueChange={(value) => onUpdate({ value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Number input
    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={
            typeof condition.value === 'string' || typeof condition.value === 'number'
              ? condition.value.toString()
              : ''
          }
          onChange={(e) =>
            onUpdate({ value: e.target.value ? Number(e.target.value) : null })
          }
          className="w-[180px]"
          placeholder="Enter value"
        />
      );
    }

    // Text input (default)
    return (
      <Input
        value={
          typeof condition.value === 'string' ? condition.value : ''
        }
        onChange={(e) => onUpdate({ value: e.target.value || null })}
        className="w-[180px]"
        placeholder="Enter value"
      />
    );
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
      <Select
        value={condition.field}
        onValueChange={handleFieldChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(value) => handleOperatorChange(value as FilterOperator)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {operatorLabels[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {renderValueInput()}

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

