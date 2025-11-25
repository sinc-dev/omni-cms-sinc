'use client';

import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface SortOption {
  value: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
}

export interface SortSelectorProps {
  options: SortOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SortSelector({
  options,
  value,
  onChange,
  className,
}: SortSelectorProps) {
  const currentSort = React.useMemo(() => {
    return options.find((opt) => opt.value === value) || options[0];
  }, [options, value]);

  const handleSelect = (option: SortOption) => {
    onChange?.(option.value);
  };

  const toggleOrder = () => {
    if (!currentSort) return;
    const newOrder = currentSort.order === 'asc' ? 'desc' : 'asc';
    const newValue = `${currentSort.field}_${newOrder}`;
    onChange?.(newValue);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Sort: {currentSort?.label || 'None'}
          {currentSort?.order === 'asc' ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-2 h-3 w-3" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option)}
            className={value === option.value ? 'bg-accent' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <span>{option.label}</span>
              {value === option.value && (
                <span className="text-xs text-muted-foreground">
                  {option.order === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        {currentSort && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={toggleOrder}>
              <div className="flex items-center justify-between w-full">
                <span>Toggle order</span>
                <span className="text-xs text-muted-foreground">
                  {currentSort.order === 'asc' ? '↑' : '↓'}
                </span>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

