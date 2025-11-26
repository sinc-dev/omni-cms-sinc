'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (url: string, text?: string, openInNewTab?: boolean) => void;
  initialUrl?: string;
  initialText?: string;
  initialOpenInNewTab?: boolean;
}

export function LinkDialog({
  open,
  onOpenChange,
  onInsert,
  initialUrl = '',
  initialText = '',
  initialOpenInNewTab = false,
}: LinkDialogProps) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Update form fields when dialog opens with initial values
      // This is necessary to reset/pre-fill the form for editing existing links
      setUrl(initialUrl || '');
      setText(initialText || '');
      setOpenInNewTab(initialOpenInNewTab || false);
      setUrlError(null);
    } else {
      // Reset when dialog closes
      setUrl('');
      setText('');
      setOpenInNewTab(false);
      setUrlError(null);
    }
    // Only depend on 'open' to avoid cascading renders
    // Initial values are read when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const validateUrl = (urlToValidate: string): boolean => {
    if (!urlToValidate.trim()) {
      setUrlError('URL is required');
      return false;
    }

    try {
      // Allow relative URLs (starting with /) or absolute URLs
      if (urlToValidate.startsWith('/')) {
        return true;
      }
      new URL(urlToValidate);
      return true;
    } catch {
      // If URL constructor fails, check if it's a valid URL pattern
      const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlPattern.test(urlToValidate)) {
        setUrlError('Please enter a valid URL');
        return false;
      }
      return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    if (!validateUrl(url)) {
      return;
    }

    onInsert(url.trim(), text.trim() || undefined, openInNewTab);
    onOpenChange(false);
    
    // Reset form after submission
    setUrl('');
    setText('');
    setOpenInNewTab(false);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (urlError) {
      setUrlError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="link-url"
                type="text"
                placeholder="https://example.com or /page"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                aria-invalid={!!urlError}
                aria-describedby={urlError ? 'url-error' : undefined}
                autoFocus
              />
              {urlError && (
                <p id="url-error" className="text-sm text-destructive">
                  {urlError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Link text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the selected text or URL
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="link-new-tab"
                checked={openInNewTab}
                onCheckedChange={(checked) => setOpenInNewTab(checked === true)}
              />
              <Label
                htmlFor="link-new-tab"
                className="font-normal cursor-pointer text-sm"
              >
                Open in new tab
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Insert Link</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

