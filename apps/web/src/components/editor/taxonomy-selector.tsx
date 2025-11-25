'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
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
  onCreateTerm?: (term: { name: string; slug: string }) => Promise<{ id: string; name: string; slug: string } | null>;
  onRefreshTerms?: () => Promise<void>;
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
  onCreateTerm,
  onRefreshTerms,
}: TaxonomySelectorProps) {
  const terms = taxonomy.terms || [];
  const rootTerms = terms.filter((t) => !t.parentId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');
  const [newTermSlug, setNewTermSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreateTerm = async () => {
    if (!newTermName.trim() || !onCreateTerm) return;

    setCreating(true);
    try {
      const slug = newTermSlug || generateSlug(newTermName);
      const newTerm = await onCreateTerm({
        name: newTermName.trim(),
        slug,
      });

      // Refresh terms if callback provided
      if (onRefreshTerms) {
        await onRefreshTerms();
      }

      // Auto-select the newly created term
      if (newTerm?.id) {
        onChange([...selectedTermIds, newTerm.id]);
      }

      // Reset form and close dialog
      setNewTermName('');
      setNewTermSlug('');
      setCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create term:', err);
    } finally {
      setCreating(false);
    }
  };

  const CreateTermButton = () => {
    if (!onCreateTerm) return null;

    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Add New {taxonomy.name.slice(0, -1)}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {taxonomy.name.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="term-name">Name *</Label>
              <Input
                id="term-name"
                placeholder={`e.g., ${taxonomy.name === 'Categories' ? 'Technology' : 'Tag Name'}`}
                value={newTermName}
                onChange={(e) => {
                  setNewTermName(e.target.value);
                  if (!newTermSlug) {
                    setNewTermSlug(generateSlug(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-slug">Slug</Label>
              <Input
                id="term-slug"
                placeholder="auto-generated"
                value={newTermSlug}
                onChange={(e) => setNewTermSlug(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewTermName('');
                  setNewTermSlug('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTerm} disabled={creating || !newTermName.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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
        <CreateTermButton />
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
      <CreateTermButton />
    </div>
  );
}

