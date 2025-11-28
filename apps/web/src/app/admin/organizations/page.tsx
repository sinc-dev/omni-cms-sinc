'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Loader2,
  Download,
  Upload,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/errors';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { ExportDialog, ImportDialog } from '@/components/import-export';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormErrorSummary,
  useFormState,
  Input,
  Textarea,
} from '@/components/form-wrappers';
import { organizationFormDialogSchema } from '@/lib/validations/organization';
import type { OrganizationFormDialogInput } from '@/lib/validations/organization';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OrganizationsPage() {
  const pathname = usePathname();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const isRedirectingRef = useRef(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedOrgForImportExport, setSelectedOrgForImportExport] = useState<Organization | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch organizations
  useEffect(() => {
    // Don't make API calls if we're on an error page
    if (pathname === '/unauthorized' || pathname === '/forbidden') {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests if redirecting
    if (isRedirectingRef.current) {
      return;
    }

    // Check sessionStorage for redirect flag
    if (typeof window !== 'undefined' && sessionStorage.getItem('omni-cms:redirecting') === 'true') {
      return;
    }

    const fetchOrganizations = async () => {
      setLoading(true);
      clearError();

      try {
        const response = (await apiClient.getOrganizations()) as {
          success: boolean;
          data: Organization[];
        };

        if (response.success) {
          let filtered = response.data;
          if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            filtered = response.data.filter(
              (org) =>
                org.name.toLowerCase().includes(searchLower) ||
                org.slug.toLowerCase().includes(searchLower) ||
                (org.domain && org.domain.toLowerCase().includes(searchLower))
            );
          }
          setOrganizations(filtered);
        } else {
          handleError('Failed to load organizations', { title: 'Failed to Load Organizations' });
        }
      } catch (err) {
        // Check if it's a 401 error - redirect will happen in API client
        if (err instanceof ApiError && err.status === 401) {
          isRedirectingRef.current = true;
          // Redirect will happen in API client, just return early
          return;
        }
        console.error('Failed to load organizations:', err);
        handleError(err, { title: 'Failed to Load Organizations' });
      } finally {
        setLoading(false);
      }
    };

      fetchOrganizations();
    }, [debouncedSearch, pathname, clearError, handleError]);

  // Generate slug from name
  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreate = withErrorHandling(async (data: OrganizationFormDialogInput) => {
    clearError();

    try {
      const settingsObj = JSON.parse(data.settings);

      await apiClient.createOrganization({
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        settings: settingsObj,
      });

      setDialogOpen(false);

      // Refresh organizations list
      const response = (await apiClient.getOrganizations()) as {
        success: boolean;
        data: Organization[];
      };
      if (response.success) {
        setOrganizations(response.data);
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Create Organization' });
    }
  }, { title: 'Failed to Create Organization' });

  const handleEdit = withErrorHandling(async (data: OrganizationFormDialogInput) => {
    if (!editingOrg) {
      handleError('Organization is required', { title: 'Validation Error' });
      return;
    }

    clearError();

    try {
      const settingsObj = JSON.parse(data.settings);

      await apiClient.updateOrganization(editingOrg.id, {
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        settings: settingsObj,
      });

      setEditingOrg(null);
      setEditDialogOpen(false);

      // Refresh organizations list
      const response = (await apiClient.getOrganizations()) as {
        success: boolean;
        data: Organization[];
      };
      if (response.success) {
        setOrganizations(response.data);
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Update Organization' });
    }
  }, { title: 'Failed to Update Organization' });

  const handleDelete = withErrorHandling(async (orgId: string) => {
    try {
      await apiClient.deleteOrganization(orgId);

      // Refresh organizations list
      const response = (await apiClient.getOrganizations()) as {
        success: boolean;
        data: Organization[];
      };
      if (response.success) {
        setOrganizations(response.data);
      }
      setOrgToDelete(null);
    } catch (err) {
      handleError(err, { title: 'Failed to Delete Organization' });
    }
  }, { title: 'Failed to Delete Organization' });

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage organizations (Super Admin Only)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
            </DialogHeader>
            <Form
              schema={organizationFormDialogSchema}
              defaultValues={{
                name: '',
                slug: '',
                domain: '',
                settings: '{}',
              }}
              onSubmit={handleCreate}
              mode="onBlur"
            >
              <CreateOrganizationFormContent
                onCancel={() => {
                  setDialogOpen(false);
                  clearError();
                }}
                generateSlug={generateSlug}
              />
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading organizations...</p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && organizations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No organizations match your search.'
                  : 'No organizations yet. Create one to get started.'}
              </p>
            </div>
          )}

          {!loading && !error && organizations.length > 0 && (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-sm">Name</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-sm">Slug</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-sm">Domain</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-sm">Created</th>
                    <th className="h-10 px-4 text-right align-middle font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="border-b hover:bg-muted/50">
                      <td className="p-4 align-middle">
                        <div className="font-medium">{org.name}</div>
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {org.slug}
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {org.domain || '—'}
                      </td>
                      <td className="p-4 align-middle text-sm text-muted-foreground">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(org)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrgForImportExport(org);
                                setExportDialogOpen(true);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrgForImportExport(org);
                                setImportDialogOpen(true);
                              }}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Import
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setOrgToDelete(org);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          {editingOrg && (
            <Form
              schema={organizationFormDialogSchema}
              defaultValues={{
                name: editingOrg.name || '',
                slug: editingOrg.slug || '',
                domain: editingOrg.domain || '',
                settings: editingOrg.settings
                  ? JSON.stringify(JSON.parse(editingOrg.settings), null, 2)
                  : '{}',
              }}
              onSubmit={handleEdit}
              mode="onBlur"
            >
              <EditOrganizationFormContent
                onCancel={() => {
                  setEditDialogOpen(false);
                  setEditingOrg(null);
                  clearError();
                }}
              />
            </Form>
          )}
        </DialogContent>
      </Dialog>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={(open) => {
          setExportDialogOpen(open);
          if (!open) {
            setSelectedOrgForImportExport(null);
          }
        }}
        organizationId={selectedOrgForImportExport?.id}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setSelectedOrgForImportExport(null);
          }
        }}
        organizationId={selectedOrgForImportExport?.id}
        onImportComplete={() => {
          // Refresh organizations list after import
          const fetchOrganizations = withErrorHandling(async () => {
            setLoading(true);
            clearError();

            try {
              const response = (await apiClient.getOrganizations()) as {
                success: boolean;
                data: Organization[];
              };

              if (response.success) {
                let filtered = response.data;
                if (debouncedSearch) {
                  const searchLower = debouncedSearch.toLowerCase();
                  filtered = response.data.filter(
                    (org) =>
                      org.name.toLowerCase().includes(searchLower) ||
                      org.slug.toLowerCase().includes(searchLower) ||
                      (org.domain && org.domain.toLowerCase().includes(searchLower))
                  );
                }
                setOrganizations(filtered);
              }
            } catch (err) {
              console.error('Failed to refresh organizations:', err);
            } finally {
              setLoading(false);
            }
          }, { title: 'Failed to Refresh Organizations' });

          fetchOrganizations();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setOrgToDelete(null);
          }
        }}
        onConfirm={async () => {
          if (!orgToDelete) return;
          await handleDelete(orgToDelete.id);
        }}
        title="Delete Organization"
        description="Are you sure you want to delete this organization? This action cannot be undone."
        itemName={orgToDelete ? `"${orgToDelete.name}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

// Create Organization Form Content
function CreateOrganizationFormContent({
  onCancel,
  generateSlug,
}: {
  onCancel: () => void;
  generateSlug: (name: string) => string;
}) {
  const { form, isSubmitting, isValid, errors } = useFormState<OrganizationFormDialogInput>();

  return (
    <>
      <div className="space-y-4">
        <FormField name="name">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="name">
                Name
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={value as string}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    onChange(newValue);
                    // Auto-generate slug if slug is empty
                    const currentSlug = form.getValues('slug');
                    if (!currentSlug) {
                      form.setValue('slug', generateSlug(newValue));
                    }
                  }}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="slug">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="slug">
                Slug
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="slug"
                  placeholder="my-organization"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormDescription>
                Used in URLs and API endpoints. Cannot contain spaces or special characters.
              </FormDescription>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="domain">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="domain">
                Domain (Optional)
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="settings">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="settings">
                Settings (JSON)
              </FormLabel>
              <FormControl error={invalid}>
                <Textarea
                  id="settings"
                  placeholder='{"key": "value"}'
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  rows={6}
                  className="font-mono text-sm"
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormErrorSummary errors={errors as Record<string, { message?: string }>} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isValid}>
            {isSubmitting ? (
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
    </>
  );
}

// Edit Organization Form Content
function EditOrganizationFormContent({ onCancel }: { onCancel: () => void }) {
  const { isSubmitting, isValid, errors } = useFormState<OrganizationFormDialogInput>();

  return (
    <>
      <div className="space-y-4">
        <FormField name="name">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="edit-name">
                Name
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="edit-name"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="slug">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel required error={invalid} htmlFor="edit-slug">
                Slug
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="edit-slug"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormDescription>
                Used in URLs and API endpoints. Cannot contain spaces or special characters.
              </FormDescription>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="domain">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="edit-domain">
                Domain (Optional)
              </FormLabel>
              <FormControl error={invalid}>
                <Input
                  id="edit-domain"
                  value={(value as string) || ''}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormField name="settings">
          {({ value, onChange, onBlur, error, invalid }) => (
            <FormItem>
              <FormLabel error={invalid} htmlFor="edit-settings">
                Settings (JSON)
              </FormLabel>
              <FormControl error={invalid}>
                <Textarea
                  id="edit-settings"
                  value={value as string}
                  onChange={(e) => onChange(e.target.value)}
                  onBlur={onBlur}
                  rows={6}
                  className="font-mono text-sm"
                  error={invalid}
                />
              </FormControl>
              <FormMessage error={error} />
            </FormItem>
          )}
        </FormField>

        <FormErrorSummary errors={errors as Record<string, { message?: string }>} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isValid}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}


