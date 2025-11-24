'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, Download, Upload } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { ExportDialog, ImportDialog } from '@/components/admin/import-export';

export default function SettingsPage() {
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [settings, setSettings] = useState('{}');

  // Load organization data
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    const fetchOrganization = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      try {
        const response = (await api.getOrganization(organization.id)) as {
          success: boolean;
          data: {
            id: string;
            name: string;
            slug: string;
            domain: string | null;
            settings: string | null;
          };
        };

        if (response.success && response.data) {
          const orgData = response.data;
          setName(orgData.name);
          setSlug(orgData.slug);
          setDomain(orgData.domain || '');
          setSettings(
            orgData.settings
              ? JSON.stringify(JSON.parse(orgData.settings), null, 2)
              : '{}'
          );
        }
      } catch (err) {
        console.error('Failed to load organization:', err);
        handleError(err, { title: 'Failed to Load Settings' });
      } finally {
        setLoading(false);
      }
    }, { title: 'Failed to Load Settings' });

    fetchOrganization();
  }, [organization, api, orgLoading, withErrorHandling, clearError, handleError]);

  const handleSave = withErrorHandling(async () => {
    if (!api || !organization || !name || !slug) {
      handleError('Name and slug are required', { title: 'Validation Error' });
      return;
    }

    setSaving(true);
    clearError();

    try {
      let settingsObj = {};
      try {
        settingsObj = JSON.parse(settings);
      } catch (err) {
        handleError('Invalid JSON in settings. Please check your JSON syntax.', {
          title: 'Validation Error',
        });
        setSaving(false);
        return;
      }

      await api.updateOrganization(organization.id, {
        name,
        slug,
        domain: domain || null,
        settings: settingsObj,
      });

      // Show success (could use toast here)
      clearError();
    } catch (err) {
      handleError(err, { title: 'Failed to Save Settings' });
    } finally {
      setSaving(false);
    }
  }, { title: 'Failed to Save Settings' });

  if (orgLoading || !organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {orgLoading ? 'Loading...' : 'Please select an organization to view settings.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your organization settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !name || !slug}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Organization"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-organization"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs and API endpoints. Cannot contain spaces or special characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain (Optional)</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
              />
              <p className="text-xs text-muted-foreground">
                Custom domain for your organization's public API.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings">Settings JSON</Label>
              <Textarea
                id="settings"
                value={settings}
                onChange={(e) => setSettings(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder='{"key": "value"}'
              />
              <p className="text-xs text-muted-foreground">
                Custom settings stored as JSON. Must be valid JSON format.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your organization data as JSON or import data from a JSON file.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage API keys for public access to your organization's content.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/admin/api-keys'}>
              Manage API Keys
            </Button>
          </CardContent>
        </Card>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          // Optionally refresh data after import
          if (organization && api) {
            const fetchOrganization = withErrorHandling(async () => {
              const response = (await api.getOrganization(organization.id)) as {
                success: boolean;
                data: {
                  id: string;
                  name: string;
                  slug: string;
                  domain: string | null;
                  settings: string | null;
                };
              };
              if (response.success && response.data) {
                const orgData = response.data;
                setName(orgData.name);
                setSlug(orgData.slug);
                setDomain(orgData.domain || '');
                setSettings(
                  orgData.settings
                    ? JSON.stringify(JSON.parse(orgData.settings), null, 2)
                    : '{}'
                );
              }
            }, { title: 'Failed to Refresh Data' });
            fetchOrg();
          }
        }}
      />
    </div>
  );
}
