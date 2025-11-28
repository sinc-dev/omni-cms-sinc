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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaPicker } from './media-picker';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useOrganization } from '@/lib/context/organization-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Loader2 } from 'lucide-react';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (src: string, alt?: string) => void;
}

export function ImageDialog({ open, onOpenChange, onInsert }: ImageDialogProps) {
  const [url, setUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const api = useApiClient();
  const { organization } = useOrganization();
  const { handleError } = useErrorHandler();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setUrl('');
      setAltText('');
      setSelectedMediaId(null);
      setUrlError(null);
    }
  }, [open]);

  // Load media URL when media ID is selected
  useEffect(() => {
    if (selectedMediaId && organization) {
      setLoadingMedia(true);
      api.getMediaById(selectedMediaId)
        .then((response: any) => {
          if (response.success && response.data) {
            // Use the media URL - check for various possible URL fields
            const mediaUrl = 
              response.data.urls?.url || 
              response.data.url || 
              response.data.urls?.thumbnailUrl || 
              '';
            if (mediaUrl) {
              setUrl(mediaUrl);
            } else {
              handleError('Media URL not found', { title: 'Error Loading Media' });
            }
          } else {
            handleError('Failed to load media', { title: 'Error Loading Media' });
          }
        })
        .catch((error: unknown) => {
          handleError(error, { title: 'Error Loading Media' });
        })
        .finally(() => {
          setLoadingMedia(false);
        });
    } else if (!selectedMediaId) {
      setUrl('');
    }
  }, [selectedMediaId, organization, api, handleError]);

  const validateUrl = (urlToValidate: string): boolean => {
    if (!urlToValidate.trim()) {
      setUrlError('Image URL is required');
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

    onInsert(url.trim(), altText.trim() || undefined);
    onOpenChange(false);
    
    // Reset form after submission
    setUrl('');
    setAltText('');
    setSelectedMediaId(null);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (urlError) {
      setUrlError(null);
    }
    // Clear media selection if user types a URL
    if (value && selectedMediaId) {
      setSelectedMediaId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Tabs defaultValue="media" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="media">Media Library</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="media" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select from Media Library</Label>
                  <MediaPicker
                    value={selectedMediaId}
                    onChange={(mediaId) => {
                      setSelectedMediaId(mediaId);
                      setUrl(''); // Clear URL input when media is selected
                    }}
                  />
                  {loadingMedia && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading media URL...
                    </div>
                  )}
                  {selectedMediaId && url && (
                    <div className="mt-2">
                      <img
                        src={url}
                        alt="Preview"
                        className="max-w-full h-auto rounded border max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">
                    Image URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="image-url"
                    type="text"
                    placeholder="https://example.com/image.jpg or /image.jpg"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    aria-invalid={!!urlError}
                    aria-describedby={urlError ? 'url-error' : undefined}
                  />
                  {urlError && (
                    <p id="url-error" className="text-sm text-destructive">
                      {urlError}
                    </p>
                  )}
                  {url && !urlError && (
                    <div className="mt-2">
                      <img
                        src={url}
                        alt="Preview"
                        className="max-w-full h-auto rounded border max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          setUrlError('Failed to load image. Please check the URL.');
                        }}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="image-alt">Alt Text (optional)</Label>
              <Input
                id="image-alt"
                type="text"
                placeholder="Describe the image for accessibility"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Alt text helps screen readers understand the image
              </p>
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
            <Button type="submit" disabled={!url || loadingMedia}>
              Insert Image
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

