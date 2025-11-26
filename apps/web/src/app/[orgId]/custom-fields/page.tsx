'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  MoreVertical,
  Hash,
  Type,
  FileText,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  List,
  Code,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { useSchema } from '@/lib/hooks/use-schema';
import { Textarea } from '@/components/ui/textarea';
import { FilterBar } from '@/components/filters/filter-bar';
import { Suspense } from 'react';

import { useFilterParams } from '@/lib/hooks/use-filter-params';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';

interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  settings?: string | null;
  createdAt: string;
  updatedAt: string;
}

type FieldType =
  | 'text'
  | 'textarea'
  | 'rich_text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'media'
  | 'relation'
  | 'select'
  | 'multi_select'
  | 'json';

interface FieldTypeInfo {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const fieldTypes: FieldTypeInfo[] = [
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" />, description: 'Single line text input' },
  { type: 'textarea', label: 'Textarea', icon: <FileText className="h-4 w-4" />, description: 'Multi-line text input' },
  { type: 'rich_text', label: 'Rich Text', icon: <FileText className="h-4 w-4" />, description: 'Rich text editor' },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" />, description: 'Numeric input' },
  { type: 'boolean', label: 'Boolean', icon: <CheckSquare className="h-4 w-4" />, description: 'True/false checkbox' },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" />, description: 'Date picker' },
  { type: 'datetime', label: 'Date & Time', icon: <Calendar className="h-4 w-4" />, description: 'Date and time picker' },
  { type: 'media', label: 'Media', icon: <ImageIcon className="h-4 w-4" />, description: 'Media picker' },
  { type: 'relation', label: 'Relation', icon: <LinkIcon className="h-4 w-4" />, description: 'Link to another post' },
  { type: 'select', label: 'Select', icon: <List className="h-4 w-4" />, description: 'Single selection dropdown' },
  { type: 'multi_select', label: 'Multi Select', icon: <List className="h-4 w-4" />, description: 'Multiple selection dropdown' },
  { type: 'json', label: 'JSON', icon: <Code className="h-4 w-4" />, description: 'JSON data structure' },
];

const getFieldTypeInfo = (type: FieldType): FieldTypeInfo | undefined => {
  return fieldTypes.find((ft) => ft.type === type);
};

interface PaginatedResponse {
  success: boolean;
  data: CustomField[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

function CustomFieldsPageContent() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();

  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { success: showSuccess } = useToastHelpers();
  const { schema: customFieldsSchema } = useSchema('custom-fields');
  const { getFilter, updateFilters } = useFilterParams();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null);
  
  // Get filter values from URL
  const filterType = getFilter('field_type') || 'all';

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [settings, setSettings] = useState('{}');

  // Generate slug from name
  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s_]/g, '')
      .replace(/[\s_-]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Get field types from schema or fallback to hardcoded
  const availableFieldTypes = customFieldsSchema?.enums?.customFieldType?.values 
    ? customFieldsSchema.enums.customFieldType.values.map((type: string) => {
        const info = fieldTypes.find(ft => ft.type === type);
        return info || { type, label: type, icon: <Code className="h-4 w-4" />, description: type };
      })
    : fieldTypes;

  // Fetch custom fields
  useEffect(() => {
    if (!organization || orgLoading) {
      return;
    }

    const fetchCustomFields = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {};
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }
      if (filterType !== 'all') {
        params.field_type = filterType;
      }

      const response = (await api.getCustomFields()) as PaginatedResponse;

      if (response.success) {
        setCustomFields(response.data);
      } else {
        handleError('Failed to load custom fields', { title: 'Failed to Load Custom Fields' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Custom Fields' });

    fetchCustomFields();
  }, [organization, api, debouncedSearch, filterType, orgLoading, withErrorHandling, clearError, handleError]);

  const handleSave = withErrorHandling(async () => {
    if (!api || !name || !slug) return;

    setSaving(true);
    clearError();

    let parsedSettings: Record<string, unknown> | undefined;
    try {
      parsedSettings = settings.trim() ? JSON.parse(settings) : undefined;
    } catch {
      handleError('Invalid JSON in settings field', { title: 'Validation Error' });
      setSaving(false);
      return;
    }

    const data = {
      name,
      slug,
      fieldType,
      settings: parsedSettings,
    };

    if (editingField) {
      await api.updateCustomField(editingField.id, data);
      showSuccess(`Custom field "${data.name}" updated successfully`, 'Custom Field Updated');
    } else {
      await api.createCustomField(data);
      showSuccess(`Custom field "${data.name}" created successfully`, 'Custom Field Created');
    }

    // Reset form and close dialog
    closeDialog();

    // Refresh custom fields list
    setCustomFields([]);
    setSaving(false);
  }, { title: 'Failed to Save Custom Field' });

  const handleDelete = withErrorHandling(async (fieldId: string) => {
    if (!api) return;

    const deletedField = fieldToDelete || customFields.find(f => f.id === fieldId);
    const deletedName = deletedField?.name || 'Custom field';
    await api.deleteCustomField(fieldId);
    // Refresh custom fields list
    setCustomFields([]);
    showSuccess(`Custom field "${deletedName}" deleted successfully`, 'Custom Field Deleted');
  }, { title: 'Failed to Delete Custom Field' });

  const openEditDialog = (field: CustomField) => {
    setEditingField(field);
    setName(field.name);
    setSlug(field.slug);
    setFieldType(field.fieldType as FieldType);
    setSettings(field.settings || '{}');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingField(null);
    setName('');
    setSlug('');
    setFieldType('text');
    setSettings('{}');
    clearError();
  };

  const filteredFields = customFields.filter((field) => {
    if (filterType !== 'all' && field.fieldType !== filterType) {
      return false;
    }
    return true;
  });

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view custom fields.'}
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
          <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
          <p className="text-muted-foreground">Create reusable content fields</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Author Bio, Product Price"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug && !editingField) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="author_bio"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used in code. Lowercase letters, numbers, and underscores only.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fieldType">Field Type *</Label>
                <select
                  id="fieldType"
                  aria-label="Field Type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                >
                  {availableFieldTypes.map((ft) => (
                    <option key={ft.type} value={ft.type}>
                      {ft.label} - {ft.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings">Settings (JSON, optional)</Label>
                <Textarea
                  id="settings"
                  placeholder='{"placeholder": "Enter text...", "maxLength": 100}'
                  value={settings}
                  onChange={(e) => setSettings(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  JSON object for field-specific settings (e.g., placeholder, validation rules)
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !name || !slug}
                >
                  {saving ? 'Saving...' : editingField ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search custom fields..."
            quickFilters={[
              {
                key: 'field_type',
                label: 'Field Type',
                value: filterType,
                options: [
                  { value: 'all', label: 'All Types' },
                  ...fieldTypes.map((ft) => ({
                    value: ft.type,
                    label: ft.label,
                  })),
                ],
                onChange: (value) =>
                  updateFilters({ field_type: value === 'all' ? undefined : value }),
              },
            ]}
            onClearAll={() => {
              setSearch('');
              updateFilters({ field_type: undefined });
            }}
          />
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Loading custom fields...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && filteredFields.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {debouncedSearch || filterType !== 'all'
                  ? 'No custom fields match your search.'
                  : 'No custom fields yet. Create your first field to extend content types.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredFields.length > 0 && (
            <div className="space-y-2">
              {filteredFields.map((field) => {
                const typeInfo = getFieldTypeInfo(field.fieldType as FieldType);
                return (
                  <div
                    key={field.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        {typeInfo?.icon || <Hash className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium">{field.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {field.slug} • {typeInfo?.label || field.fieldType}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(field)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setFieldToDelete(field);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (!fieldToDelete) return;
          await handleDelete(fieldToDelete.id);
        }}
        title="Delete Custom Field"
        description="Are you sure you want to delete this custom field? This will remove this field from all posts. This action cannot be undone."
        itemName={fieldToDelete ? `"${fieldToDelete.name}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

export default function CustomFieldsPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Custom Fields</h1>
            <p className="text-muted-foreground">Loading custom fields...</p>
          </div>
        </div>
      }
    >
      <CustomFieldsPageContent />
    </Suspense>
  );
}

