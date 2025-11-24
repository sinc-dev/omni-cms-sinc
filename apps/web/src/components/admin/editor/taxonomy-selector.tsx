'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  isHierarchical: boolean;
  terms?: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
}

interface TaxonomySelectorProps {
  taxonomy: Taxonomy;
  selectedTermIds: string[];
  onChange: (termIds: string[]) => void;
}

function TermCheckbox({
  term,
  terms,
  selectedTermIds,
  onChange,
}: {
  term: { id: string; name: string; slug: string; parentId?: string | null };
  terms: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
  selectedTermIds: string[];
  onChange: (termIds: string[]) => void;
  level?: number;
}) {
  const level = 0; // For hierarchical display
  const [expanded, setExpanded] = useState(true);
  const children = terms.filter((t) => t.parentId === term.id);
  const isChecked = selectedTermIds.includes(term.id);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange([...selectedTermIds, term.id]);
    } else {
      onChange(selectedTermIds.filter((id) => id !== term.id));
    }
  };

  return (
    <div>
      <div className={cn('flex items-center gap-2 py-1', level > 0 && 'ml-6')}>
        {children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
            type="button"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {children.length === 0 && <div className="w-4" />}
        <div className="flex items-center space-x-2 flex-1">
          <Checkbox
            id={`term-${term.id}`}
            checked={isChecked}
            onCheckedChange={handleToggle}
          />
          <Label
            htmlFor={`term-${term.id}`}
            className="text-sm font-normal cursor-pointer"
          >
            {term.name}
          </Label>
        </div>
      </div>
        {expanded &&
        children.map((child) => (
          <TermCheckbox
            key={child.id}
            term={child}
            terms={terms}
            selectedTermIds={selectedTermIds}
            onChange={onChange}
          />
        ))}
    </div>
  );
}

export function TaxonomySelector({
  taxonomy,
  selectedTermIds,
  onChange,
}: TaxonomySelectorProps) {
  const terms = taxonomy.terms || [];
  const rootTerms = terms.filter((t) => !t.parentId);

  if (taxonomy.isHierarchical) {
    return (
      <div className="space-y-2">
        <Label>{taxonomy.name}</Label>
        <div className="border rounded-lg p-3 space-y-1 max-h-64 overflow-y-auto">
          {rootTerms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No terms yet</p>
          ) : (
            rootTerms.map((term) => (
              <TermCheckbox
                key={term.id}
                term={term}
                terms={terms}
                selectedTermIds={selectedTermIds}
                onChange={onChange}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // Flat taxonomy (like tags)
  return (
    <div className="space-y-2">
      <Label>{taxonomy.name}</Label>
      <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
        {terms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No terms yet</p>
        ) : (
          terms.map((term) => {
            const isChecked = selectedTermIds.includes(term.id);
            return (
              <div key={term.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`term-${term.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      onChange([...selectedTermIds, term.id]);
                    } else {
                      onChange(selectedTermIds.filter((id) => id !== term.id));
                    }
                  }}
                />
                <Label
                  htmlFor={`term-${term.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {term.name}
                </Label>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

