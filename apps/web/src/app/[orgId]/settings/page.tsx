'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Download, Upload, Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { ExportDialog, ImportDialog } from '@/components/import-export';
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
import { organizationSettingsFormSchema } from '@/lib/validations/organization';
import type { OrganizationSettingsFormInput } from '@/lib/validations/organization';
import { useOrgUrl } from '@/lib/hooks/use-org-url';

export default function SettingsPage() {
  const { getUrl } = useOrgUrl();
  const { organization, isLoading: orgLoading } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { success: showSuccess } = useToastHelpers();
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<OrganizationSettingsFormInput | null>(null);

  // Fetch guards to prevent infinite loops and redundant requests
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSubmit = withErrorHandling(async (data: OrganizationSettingsFormInput) => {
    if (!api || !organization) {
      handleError('Organization is required', { title: 'Validation Error' });
      return;
    }

    clearError();

    try {
      const settingsObj = JSON.parse(data.settings);

      await api.updateOrganization(organization.id, {
        name: data.name,
        slug: data.slug,
        domain: data.domain || null,
        settings: settingsObj,
      });

      // Show success feedback
      clearError();
      showSuccess('Settings saved successfully', 'Settings Updated');
    } catch (err) {
      handleError(err, { title: 'Failed to Save Settings' });
    }
  }, { title: 'Failed to Save Settings' });

  // Load organization data
  useEffect(() => {
    if (!organization || !api || orgLoading) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchOrganization = withErrorHandling(async () => {
      isFetchingRef.current = true;
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

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        if (response.success && response.data) {
          const orgData = response.data;
          setDefaultValues({
            name: orgData.name || '',
            slug: orgData.slug || '',
            domain: orgData.domain || '',
            settings: orgData.settings
              ? JSON.stringify(JSON.parse(orgData.settings), null, 2)
              : '{}',
          });
          hasFetchedRef.current = true;
        }
      } catch (err) {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Failed to load organization:', err);
        handleError(err, { title: 'Failed to Load Settings' });
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    }, { title: 'Failed to Load Settings' });

    fetchOrganization();

    // Cleanup: Abort request on unmount or when dependencies change
    return () => {
      abortController.abort();
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

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

  if (loading || !defaultValues) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
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
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Form
        schema={organizationSettingsFormSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        mode="onBlur"
      >
        <SettingsFormContent
          exportDialogOpen={exportDialogOpen}
          setExportDialogOpen={setExportDialogOpen}
          importDialogOpen={importDialogOpen}
          setImportDialogOpen={setImportDialogOpen}
          organization={organization}
          getUrl={getUrl}
        />
      </Form>
    </div>
  );
}

function SettingsFormContent({
  exportDialogOpen,
  setExportDialogOpen,
  importDialogOpen,
  setImportDialogOpen,
  organization,
  getUrl,
}: {
  exportDialogOpen: boolean;
  setExportDialogOpen: (open: boolean) => void;
  importDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  organization: { id: string };
  getUrl: (path: string) => string;
}) {
  const { form, isSubmitting, isValid, errors } = useFormState<OrganizationSettingsFormInput>();

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField name="name">
              {({ value, onChange, onBlur, error, invalid }) => (
                <FormItem>
                  <FormLabel required error={invalid} htmlFor="name">
                    Organization Name
                  </FormLabel>
                  <FormControl error={invalid}>
                    <Input
                      id="name"
                      value={value as string}
                      onChange={(e) => onChange(e.target.value)}
                      onBlur={onBlur}
                      placeholder="My Organization"
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
                      value={value as string}
                      onChange={(e) => onChange(e.target.value)}
                      onBlur={onBlur}
                      placeholder="my-organization"
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
                    Custom Domain (Optional)
                  </FormLabel>
                  <FormControl error={invalid}>
                    <Input
                      id="domain"
                      value={(value as string) || ''}
                      onChange={(e) => onChange(e.target.value)}
                      onBlur={onBlur}
                      placeholder="example.com"
                      error={invalid}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom domain for your organization&apos;s public API.
                  </FormDescription>
                  <FormMessage error={error} />
                </FormItem>
              )}
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField name="settings">
              {({ value, onChange, onBlur, error, invalid }) => (
                <FormItem>
                  <FormLabel error={invalid} htmlFor="settings">
                    Settings JSON
                  </FormLabel>
                  <FormControl error={invalid}>
                    <Textarea
                      id="settings"
                      value={value as string}
                      onChange={(e) => onChange(e.target.value)}
                      onBlur={onBlur}
                      rows={10}
                      className="font-mono text-sm"
                      placeholder='{"key": "value"}'
                      error={invalid}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom settings stored as JSON. Must be valid JSON format.
                  </FormDescription>
                  <FormMessage error={error} />
                </FormItem>
              )}
            </FormField>
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
              Manage API keys for public access to your organization&apos;s content.
            </p>
            <Button variant="outline" onClick={() => {
              window.location.href = getUrl('api-keys');
            }}>
              Manage API Keys
            </Button>
          </CardContent>
        </Card>
      </div>

      <FormErrorSummary errors={errors as Record<string, { message?: string }>} />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? (
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

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={() => {
          window.location.reload();
        }}
      />
    </>
  );
}

