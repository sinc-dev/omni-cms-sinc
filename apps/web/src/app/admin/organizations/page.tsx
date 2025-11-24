'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { ExportDialog, ImportDialog } from '@/components/admin/import-export';

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
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedOrgForImportExport, setSelectedOrgForImportExport] = useState<Organization | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [settings, setSettings] = useState('{}');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch organizations
  useEffect(() => {
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
        } else {
          handleError('Failed to load organizations', { title: 'Failed to Load Organizations' });
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
        handleError(err, { title: 'Failed to Load Organizations' });
      } finally {
        setLoading(false);
      }
    }, { title: 'Failed to Load Organizations' });

    fetchOrganizations();
  }, [debouncedSearch, withErrorHandling, clearError, handleError]);

  // Generate slug from name
  const generateSlug = (nameValue: string) => {
    return nameValue
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCreate = withErrorHandling(async () => {
    if (!name || !slug) {
      handleError('Name and slug are required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      let settingsObj = {};
      try {
        settingsObj = JSON.parse(settings);
      } catch {
        handleError('Invalid JSON in settings', { title: 'Validation Error' });
        setSaving(false);
        return;
      }

      await apiClient.createOrganization({
        name,
        slug,
        domain: domain || null,
        settings: settingsObj,
      });

      // Reset form and close dialog
      setName('');
      setSlug('');
      setDomain('');
      setSettings('{}');
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
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Create Organization' });

  const handleEdit = withErrorHandling(async () => {
    if (!editingOrg || !name || !slug) {
      handleError('Name and slug are required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      let settingsObj = {};
      try {
        settingsObj = JSON.parse(settings);
      } catch {
        handleError('Invalid JSON in settings', { title: 'Validation Error' });
        setSaving(false);
        return;
      }

      await apiClient.updateOrganization(editingOrg.id, {
        name,
        slug,
        domain: domain || null,
        settings: settingsObj,
      });

      // Reset form and close dialog
      setEditingOrg(null);
      setName('');
      setSlug('');
      setDomain('');
      setSettings('{}');
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
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Update Organization' });

  const handleDelete = withErrorHandling(async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteOrganization(org.id);

      // Refresh organizations list
      const response = (await apiClient.getOrganizations()) as {
        success: boolean;
        data: Organization[];
      };
      if (response.success) {
        setOrganizations(response.data);
      }
    } catch (err) {
      handleError(err, { title: 'Failed to Delete Organization' });
    }
  }, { title: 'Failed to Delete Organization' });

  const openEditDialog = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setSlug(org.slug);
    setDomain(org.domain || '');
    setSettings(org.settings ? JSON.stringify(JSON.parse(org.settings), null, 2) : '{}');
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Organization"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="my-organization"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings">Settings (JSON)</Label>
                <Textarea
                  id="settings"
                  placeholder='{"key": "value"}'
                  value={settings}
                  onChange={(e) => setSettings(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setName('');
                    setSlug('');
                    setDomain('');
                    setSettings('{}');
                    clearError();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || !name || !slug}>
                  {saving ? (
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
                              onClick={() => handleDelete(org)}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-domain">Domain (Optional)</Label>
              <Input
                id="edit-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-settings">Settings (JSON)</Label>
              <Textarea
                id="edit-settings"
                value={settings}
                onChange={(e) => setSettings(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingOrg(null);
                  setName('');
                  setSlug('');
                  setDomain('');
                  setSettings('{}');
                  clearError();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={saving || !name || !slug}>
                {saving ? (
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
    </div>
  );
}

