'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrganization } from '@/lib/context/organization-context';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
}

export function ExportDialog({ open, onOpenChange, organizationId }: ExportDialogProps) {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [exporting, setExporting] = useState(false);

  const orgId = organizationId || organization?.id;

  // Export options state
  const [includePosts, setIncludePosts] = useState(true);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeTaxonomies, setIncludeTaxonomies] = useState(true);
  const [includeCustomFields, setIncludeCustomFields] = useState(true);

  const handleExport = withErrorHandling(async () => {
    if (!orgId || !api) {
      handleError('Organization ID is required', { title: 'Export Error' });
      return;
    }

    setExporting(true);
    clearError();

    try {
      const options = {
        includePosts,
        includeMedia,
        includeTaxonomies,
        includeCustomFields,
      };

      // Use fetch directly since export returns text, not JSON
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
      const response = await fetch(`${baseUrl}/api/admin/v1/organizations/${orgId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Export failed: ${response.statusText}`);
      }

      // Get the JSON text from response
      const jsonText = await response.text();

      // Create blob and download
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${orgId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Close dialog after successful export
      onOpenChange(false);
    } catch (err) {
      handleError(err, { title: 'Export Failed' });
    } finally {
      setExporting(false);
    }
  }, { title: 'Export Failed' });

  const handleClose = () => {
    if (!exporting) {
      clearError();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Organization Data</DialogTitle>
          <DialogDescription>
            Select what data to include in the export. The exported file will be downloaded as JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePosts"
                checked={includePosts}
                onCheckedChange={(checked) => setIncludePosts(checked === true)}
              />
              <Label htmlFor="includePosts" className="cursor-pointer">
                Include Posts
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeMedia"
                checked={includeMedia}
                onCheckedChange={(checked) => setIncludeMedia(checked === true)}
              />
              <Label htmlFor="includeMedia" className="cursor-pointer">
                Include Media Metadata
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTaxonomies"
                checked={includeTaxonomies}
                onCheckedChange={(checked) => setIncludeTaxonomies(checked === true)}
              />
              <Label htmlFor="includeTaxonomies" className="cursor-pointer">
                Include Taxonomies
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCustomFields"
                checked={includeCustomFields}
                onCheckedChange={(checked) => setIncludeCustomFields(checked === true)}
              />
              <Label htmlFor="includeCustomFields" className="cursor-pointer">
                Include Custom Fields
              </Label>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || (!includePosts && !includeMedia && !includeTaxonomies && !includeCustomFields)}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

