'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Tag,
  FolderTree,
  MoreVertical,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  isHierarchical: boolean;
  createdAt: string;
  updatedAt: string;
  terms?: TaxonomyTerm[];
}

interface TaxonomyTerm {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: TaxonomyTerm | null;
  children?: TaxonomyTerm[];
}

interface PaginatedResponse {
  success: boolean;
  data: Taxonomy[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

function TermTree({
  term,
  terms,
  level = 0,
  onEdit,
  onDelete,
}: {
  term: TaxonomyTerm;
  terms: TaxonomyTerm[];
  level?: number;
  onEdit: (term: TaxonomyTerm) => void;
  onDelete: (term: TaxonomyTerm) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = terms.filter((t) => t.parentId === term.id);

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors',
          level > 0 && 'ml-6'
        )}
      >
        {children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {children.length === 0 && <div className="w-5" />}
        <div className="flex-1 flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{term.name}</span>
          {term.description && (
            <span className="text-xs text-muted-foreground truncate">
              - {term.description}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(term)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(term)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded &&
        children.map((child) => (
          <TermTree
            key={child.id}
            term={child}
            terms={terms}
            level={level + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export default function TaxonomiesPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();

  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { success: showSuccess } = useToastHelpers();
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<Taxonomy | null>(null);
  const [terms, setTerms] = useState<TaxonomyTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [taxonomyDialogOpen, setTaxonomyDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editTermDialogOpen, setEditTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TaxonomyTerm | null>(null);

  // Form state for taxonomy
  const [taxonomyName, setTaxonomyName] = useState('');
  const [taxonomySlug, setTaxonomySlug] = useState('');
  const [taxonomyHierarchical, setTaxonomyHierarchical] = useState(false);

  // Form state for term
  const [termName, setTermName] = useState('');
  const [termSlug, setTermSlug] = useState('');
  const [termDescription, setTermDescription] = useState('');
  const [termParentId, setTermParentId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [deleteTaxonomyDialogOpen, setDeleteTaxonomyDialogOpen] = useState(false);
  const [taxonomyToDelete, setTaxonomyToDelete] = useState<Taxonomy | null>(null);
  const [deleteTermDialogOpen, setDeleteTermDialogOpen] = useState(false);
  const [termToDelete, setTermToDelete] = useState<TaxonomyTerm | null>(null);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch taxonomies
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchTaxonomies = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {};
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = (await api.getTaxonomies()) as PaginatedResponse;

      if (response.success) {
        setTaxonomies(response.data);
      } else {
        handleError('Failed to load taxonomies', { title: 'Failed to Load Taxonomies' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Taxonomies' });

    fetchTaxonomies();
  }, [organization, api, debouncedSearch, orgLoading, withErrorHandling, clearError, handleError]);

  // Fetch terms when taxonomy is selected
  useEffect(() => {
    if (!selectedTaxonomy || !api) {
      setTerms([]);
      return;
    }

    const fetchTerms = withErrorHandling(async () => {
      setLoadingTerms(true);
      try {
        const response = (await api.getTaxonomyTerms(selectedTaxonomy.id)) as {
          success: boolean;
          data: TaxonomyTerm[];
        };

        if (response.success) {
          setTerms(response.data);
        }
      } catch (err) {
        // Error is handled by withErrorHandling wrapper
        handleError(err, { 
          title: 'Failed to Load Terms'
        });
      } finally {
        setLoadingTerms(false);
      }
    }, { 
      title: 'Failed to Load Terms'
    });

    fetchTerms();
  }, [selectedTaxonomy, api, withErrorHandling, handleError]);

  const handleCreateTaxonomy = withErrorHandling(async () => {
    if (!api || !taxonomyName) return;

    setSaving(true);
    clearError();

    const slug = taxonomySlug || generateSlug(taxonomyName);
    await api.createTaxonomy({
      name: taxonomyName,
      slug,
      isHierarchical: taxonomyHierarchical,
    });

    // Reset form and close dialog
    setTaxonomyName('');
    setTaxonomySlug('');
    setTaxonomyHierarchical(false);
    setTaxonomyDialogOpen(false);

    // Refresh taxonomies list
    setTaxonomies([]);
    setSaving(false);
    showSuccess(`Taxonomy "${taxonomyName}" created successfully`, 'Taxonomy Created');
  }, { title: 'Failed to Create Taxonomy' });

  const handleDeleteTaxonomy = withErrorHandling(async (taxonomyId: string) => {
    if (!api) return;

    const deletedTaxonomy = taxonomyToDelete || taxonomies.find(t => t.id === taxonomyId);
    const deletedName = deletedTaxonomy?.name || 'Taxonomy';
    await api.deleteTaxonomy(taxonomyId);
    if (selectedTaxonomy?.id === taxonomyId) {
      setSelectedTaxonomy(null);
    }
    // Refresh taxonomies list
    setTaxonomies([]);
    setTaxonomyToDelete(null);
    showSuccess(`Taxonomy "${deletedName}" deleted successfully`, 'Taxonomy Deleted');
  }, { title: 'Failed to Delete Taxonomy' });

  const handleCreateTerm = withErrorHandling(async () => {
    if (!api || !selectedTaxonomy || !termName) return;

    setSaving(true);
    clearError();

    const slug = termSlug || generateSlug(termName);
    await api.createTaxonomyTerm(selectedTaxonomy.id, {
      name: termName,
      slug,
      description: termDescription || undefined,
      parentId: termParentId || undefined,
    });

    // Reset form and close dialog
    setTermName('');
    setTermSlug('');
    setTermDescription('');
    setTermParentId('');
    setTermDialogOpen(false);

    // Refresh terms list
    setTerms([]);
    setSaving(false);
    showSuccess(`Term "${termName}" created successfully`, 'Term Created');
  }, { title: 'Failed to Create Term' });

  const handleEditTerm = withErrorHandling(async () => {
    if (!api || !selectedTaxonomy || !editingTerm || !termName) return;

    setSaving(true);
    clearError();

    const slug = termSlug || generateSlug(termName);
    await api.updateTaxonomyTerm(selectedTaxonomy.id, editingTerm.id, {
      name: termName,
      slug,
      description: termDescription || undefined,
      parentId: termParentId || undefined,
    });

    // Reset form and close dialog
    setEditingTerm(null);
    setTermName('');
    setTermSlug('');
    setTermDescription('');
    setTermParentId('');
    setEditTermDialogOpen(false);

    // Refresh terms list
    setTerms([]);
    setSaving(false);
    showSuccess(`Term "${termName}" updated successfully`, 'Term Updated');
  }, { title: 'Failed to Update Term' });

  const handleDeleteTerm = withErrorHandling(async (termId: string) => {
    if (!api || !selectedTaxonomy) return;

    const deletedTerm = termToDelete || terms.find(t => t.id === termId);
    const deletedName = deletedTerm?.name || 'Term';
    await api.deleteTaxonomyTerm(selectedTaxonomy.id, termId);
    // Refresh terms list
    setTerms([]);
    setTermToDelete(null);
    showSuccess(`Term "${deletedName}" deleted successfully`, 'Term Deleted');
  }, { title: 'Failed to Delete Term' });

  const openEditTermDialog = (term: TaxonomyTerm) => {
    setEditingTerm(term);
    setTermName(term.name);
    setTermSlug(term.slug);
    setTermDescription(term.description || '');
    setTermParentId(term.parentId || '');
    setEditTermDialogOpen(true);
  };

  // Get root terms (terms without parents)
  const rootTerms = terms.filter((t) => !t.parentId);
  const parentTermOptions = terms.filter(
    (t) => !editingTerm || t.id !== editingTerm.id
  );

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view taxonomies.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxonomies</h1>
          <p className="text-muted-foreground">Manage categories and tags</p>
        </div>
        <Dialog open={taxonomyDialogOpen} onOpenChange={setTaxonomyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Taxonomy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Taxonomy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxonomy-name">Name</Label>
                <Input
                  id="taxonomy-name"
                  placeholder="e.g., Categories, Tags"
                  value={taxonomyName}
                  onChange={(e) => {
                    setTaxonomyName(e.target.value);
                    if (!taxonomySlug) {
                      setTaxonomySlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxonomy-slug">Slug</Label>
                <Input
                  id="taxonomy-slug"
                  placeholder="categories"
                  value={taxonomySlug}
                  onChange={(e) => setTaxonomySlug(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="taxonomy-hierarchical"
                  checked={taxonomyHierarchical}
                  onCheckedChange={(checked: boolean) =>
                    setTaxonomyHierarchical(checked === true)
                  }
                />
                <Label
                  htmlFor="taxonomy-hierarchical"
                  className="text-sm font-normal cursor-pointer"
                >
                  Hierarchical (like categories)
                </Label>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTaxonomyDialogOpen(false);
                    setTaxonomyName('');
                    setTaxonomySlug('');
                    setTaxonomyHierarchical(false);
                    clearError();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTaxonomy} disabled={saving || !taxonomyName}>
                  {saving ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Taxonomies List */}
        <Card>
          <CardHeader>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search taxonomies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading taxonomies...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {!loading && !error && taxonomies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  {debouncedSearch
                    ? 'No taxonomies match your search.'
                    : 'No taxonomies yet. Create one to get started.'}
                </p>
              </div>
            )}

            {!loading &&
              !error &&
              taxonomies.length > 0 &&
              taxonomies.map((taxonomy) => (
                <div
                  key={taxonomy.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors mb-2',
                    selectedTaxonomy?.id === taxonomy.id
                      ? 'border-primary bg-muted'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedTaxonomy(taxonomy)}
                >
                  <div className="flex items-center gap-3">
                    {taxonomy.isHierarchical ? (
                      <FolderTree className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Tag className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{taxonomy.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {taxonomy.slug} •{' '}
                        {taxonomy.isHierarchical ? 'Hierarchical' : 'Flat'}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaxonomyToDelete(taxonomy);
                          setDeleteTaxonomyDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Terms List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedTaxonomy ? `${selectedTaxonomy.name} Terms` : 'Select a Taxonomy'}
              </CardTitle>
              {selectedTaxonomy && (
                <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Term</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="term-name">Name</Label>
                        <Input
                          id="term-name"
                          placeholder="e.g., Technology"
                          value={termName}
                          onChange={(e) => {
                            setTermName(e.target.value);
                            if (!termSlug) {
                              setTermSlug(generateSlug(e.target.value));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="term-slug">Slug</Label>
                        <Input
                          id="term-slug"
                          placeholder="technology"
                          value={termSlug}
                          onChange={(e) => setTermSlug(e.target.value)}
                        />
                      </div>
                      {selectedTaxonomy.isHierarchical && (
                        <div className="space-y-2">
                          <Label htmlFor="term-parent">Parent Term (Optional)</Label>
                          <select
                            id="term-parent"
                            aria-label="Parent Term"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={termParentId}
                            onChange={(e) => setTermParentId(e.target.value)}
                          >
                            <option value="">None</option>
                            {parentTermOptions.map((term) => (
                              <option key={term.id} value={term.id}>
                                {term.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="term-description">Description (Optional)</Label>
                        <Input
                          id="term-description"
                          placeholder="A brief description"
                          value={termDescription}
                          onChange={(e) => setTermDescription(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTermDialogOpen(false);
                            setTermName('');
                            setTermSlug('');
                            setTermDescription('');
                            setTermParentId('');
                            clearError();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateTerm} disabled={saving || !termName}>
                          {saving ? 'Creating...' : 'Create'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedTaxonomy && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  Select a taxonomy from the list to view and manage its terms.
                </p>
              </div>
            )}

            {selectedTaxonomy && loadingTerms && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">Loading terms...</p>
              </div>
            )}

            {selectedTaxonomy && !loadingTerms && terms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No terms yet. Add your first term.</p>
              </div>
            )}

            {selectedTaxonomy &&
              !loadingTerms &&
              terms.length > 0 &&
              (selectedTaxonomy.isHierarchical ? (
                <div className="space-y-1">
                  {rootTerms.map((term) => (
                    <TermTree
                      key={term.id}
                      term={term}
                      terms={terms}
                      onEdit={openEditTermDialog}
                      onDelete={(term) => {
                        setTermToDelete(term);
                        setDeleteTermDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{term.name}</span>
                        {term.description && (
                          <span className="text-xs text-muted-foreground">
                            - {term.description}
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTermDialog(term)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setTermToDelete(term);
                              setDeleteTermDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Edit Term Dialog */}
      <Dialog open={editTermDialogOpen} onOpenChange={setEditTermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Term</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-term-name">Name</Label>
              <Input
                id="edit-term-name"
                value={termName}
                onChange={(e) => {
                  setTermName(e.target.value);
                  if (!termSlug) {
                    setTermSlug(generateSlug(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-term-slug">Slug</Label>
              <Input
                id="edit-term-slug"
                value={termSlug}
                onChange={(e) => setTermSlug(e.target.value)}
              />
            </div>
            {selectedTaxonomy?.isHierarchical && (
              <div className="space-y-2">
                <Label htmlFor="edit-term-parent">Parent Term (Optional)</Label>
                <select
                  id="edit-term-parent"
                  aria-label="Parent Term"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={termParentId}
                  onChange={(e) => setTermParentId(e.target.value)}
                >
                  <option value="">None</option>
                  {parentTermOptions.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-term-description">Description (Optional)</Label>
              <Input
                id="edit-term-description"
                value={termDescription}
                onChange={(e) => setTermDescription(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditTermDialogOpen(false);
                  setEditingTerm(null);
                  setTermName('');
                  setTermSlug('');
                  setTermDescription('');
                  setTermParentId('');
                  clearError();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditTerm} disabled={saving || !termName}>
                {saving ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Taxonomy Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteTaxonomyDialogOpen}
        onOpenChange={setDeleteTaxonomyDialogOpen}
        onConfirm={async () => {
          if (!taxonomyToDelete) return;
          await handleDeleteTaxonomy(taxonomyToDelete.id);
        }}
        title="Delete Taxonomy"
        description="Are you sure you want to delete this taxonomy? All terms will be deleted. This action cannot be undone."
        itemName={taxonomyToDelete ? `"${taxonomyToDelete.name}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Delete Term Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteTermDialogOpen}
        onOpenChange={setDeleteTermDialogOpen}
        onConfirm={async () => {
          if (!termToDelete) return;
          await handleDeleteTerm(termToDelete.id);
        }}
        title="Delete Term"
        description="Are you sure you want to delete this term? This action cannot be undone."
        itemName={termToDelete ? `"${termToDelete.name}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

