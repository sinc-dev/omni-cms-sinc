'use client';

import { useState, useEffect, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Image as ImageIcon, X } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useOrganization } from '@/lib/context/organization-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface MediaPickerProps {
  value: string | null;
  onChange: (mediaId: string | null) => void;
}

interface MediaItem {
  id: string;
  filename: string;
  url?: string;
  urls?: { url?: string; thumbnailUrl?: string };
}

export function MediaPicker({ value, onChange }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();
  const { organization } = useOrganization();
  const { handleError } = useErrorHandler();

  // Load media item if value exists
  useEffect(() => {
    if (value && organization) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setLoading(true);
        setError(null);
      }, 0);
      api.getMediaById(value)
        .then((response: { success: boolean; data?: MediaItem }) => {
          if (response.success && response.data) {
            setSelectedMedia(response.data);
          } else {
            const errorMsg = 'Failed to load media';
            startTransition(() => {
              setError(errorMsg);
            });
            handleError(errorMsg, { title: 'Failed to Load Media' });
          }
        })
        .catch((error: unknown) => {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load media';
          startTransition(() => {
            setError(errorMsg);
          });
          handleError(error, { title: 'Failed to Load Media' });
        })
        .finally(() => {
          startTransition(() => {
            setLoading(false);
          });
        });
    } else {
      startTransition(() => {
        setSelectedMedia(null);
        setError(null);
      });
    }
  }, [value, organization, api, handleError]);

  const handleSelect = (media: MediaItem) => {
    setSelectedMedia(media);
    onChange(media.id);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {selectedMedia || value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          {loading ? (
            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : error ? (
            <div className="h-16 w-16 rounded bg-destructive/10 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-destructive" />
            </div>
          ) : selectedMedia?.urls?.thumbnailUrl ? (
            <img
              src={selectedMedia.urls.thumbnailUrl}
              alt={selectedMedia.filename || selectedMedia.altText || 'Media'}
              className="h-16 w-16 object-cover rounded"
            />
          ) : (
            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {loading ? 'Loading...' : error ? 'Error loading media' : selectedMedia?.filename || 'Selected media'}
            </p>
            <p className="text-xs text-muted-foreground">
              {error ? error : `Media ID: ${value}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedMedia(null);
              setError(null);
              onChange(null);
            }}
            disabled={loading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" type="button">
            <ImageIcon className="mr-2 h-4 w-4" />
            {value ? 'Change Media' : 'Select Media'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Media picker will be integrated with media library
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                // For now, just close the dialog
                // In the future, this will open the media library
                setOpen(false);
              }}
            >
              Open Media Library
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

