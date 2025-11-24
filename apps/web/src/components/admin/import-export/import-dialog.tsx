'use client';

import { useState, useRef } from 'react';
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
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrganization } from '@/lib/context/organization-context';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: boolean;
  imported: {
    postTypes: number;
    customFields: number;
    taxonomies: number;
    posts: number;
    media: number;
  };
  errors: Array<{ type: string; id: string; error: string }>;
}

export function ImportDialog({
  open,
  onOpenChange,
  organizationId,
  onImportComplete,
}: ImportDialogProps) {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgId = organizationId || organization?.id;

  // Import options state
  const [skipExisting, setSkipExisting] = useState(false);
  const [importMedia, setImportMedia] = useState(false);
  const [dryRun, setDryRun] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setFileError(null);
    setImportResult(null);
    clearError();

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Validate file type
    if (!selectedFile.name.endsWith('.json')) {
      setFileError('Please select a JSON file');
      setFile(null);
      return;
    }

    // Validate file size (warn if > 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFileError('File is large (>10MB). Import may take a while.');
    }

    setFile(selectedFile);
  };

  const handleImport = withErrorHandling(async () => {
    if (!orgId || !api || !file) {
      handleError('Organization ID and file are required', { title: 'Import Error' });
      return;
    }

    setImporting(true);
    clearError();
    setFileError(null);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            // Validate JSON
            JSON.parse(text);
            resolve(text);
          } catch (err) {
            reject(new Error('Invalid JSON file. Please check the file format.'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });

      const importData = JSON.parse(fileContent);

      const options = {
        skipExisting,
        importMedia,
        dryRun,
      };

      const response = (await api.importOrganization(importData, options)) as {
        success: boolean;
        data: ImportResult;
      };

      if (response.success && response.data) {
        setImportResult(response.data);

        if (!dryRun && response.data.success) {
          // Call completion callback if provided
          if (onImportComplete) {
            onImportComplete();
          }
        }
      } else {
        throw new Error('Import failed. Please check the file format.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid JSON')) {
        setFileError(err.message);
      } else {
        handleError(err, { title: 'Import Failed' });
      }
    } finally {
      setImporting(false);
    }
  }, { title: 'Import Failed' });

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setFileError(null);
      setImportResult(null);
      clearError();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileError(null);
    setImportResult(null);
    clearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Organization Data</DialogTitle>
          <DialogDescription>
            Upload a JSON file to import data into this organization. Use dry run mode to preview changes without importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="import-file">Import File (JSON)</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {file ? file.name : 'Select JSON File'}
              </Button>
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
            {fileError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{fileError}</span>
              </div>
            )}
          </div>

          {/* Import Options */}
          <div className="space-y-3 border-t pt-4">
            <Label>Import Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipExisting"
                checked={skipExisting}
                onCheckedChange={(checked) => setSkipExisting(checked === true)}
              />
              <Label htmlFor="skipExisting" className="cursor-pointer text-sm">
                Skip existing items (don't overwrite)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="importMedia"
                checked={importMedia}
                onCheckedChange={(checked) => setImportMedia(checked === true)}
              />
              <Label htmlFor="importMedia" className="cursor-pointer text-sm">
                Import media files
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryRun"
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(checked === true)}
              />
              <Label htmlFor="dryRun" className="cursor-pointer text-sm">
                Dry run (preview only, don't import)
              </Label>
            </div>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <Label className="text-base font-semibold">
                      {dryRun ? 'Dry Run Complete' : 'Import Complete'}
                    </Label>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <Label className="text-base font-semibold text-destructive">
                      Import Completed with Errors
                    </Label>
                  </>
                )}
              </div>

              <div className="rounded-md bg-muted p-3 space-y-2">
                <div className="text-sm font-medium">Imported:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Post Types: {importResult.imported.postTypes}</div>
                  <div>Custom Fields: {importResult.imported.customFields}</div>
                  <div>Taxonomies: {importResult.imported.taxonomies}</div>
                  <div>Posts: {importResult.imported.posts}</div>
                  <div>Media: {importResult.imported.media}</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-md bg-destructive/10 p-3 space-y-2">
                  <div className="text-sm font-medium text-destructive">
                    Errors ({importResult.errors.length}):
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx} className="text-xs text-destructive">
                        {err.type} ({err.id}): {err.error}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {importResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={importResult ? handleReset : handleClose}
            disabled={importing}
          >
            {importResult ? 'Import Another' : 'Cancel'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || !file}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {dryRun ? 'Preview Import' : 'Import'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

