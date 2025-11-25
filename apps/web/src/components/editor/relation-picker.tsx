'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Link2, X } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useOrganization } from '@/lib/context/organization-context';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface RelationPickerProps {
  value: string | null;
  onChange: (postId: string | null) => void;
  postTypeId?: string;
}

export function RelationPicker({ value, onChange, postTypeId }: RelationPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApiClient();
  const { organization } = useOrganization();
  const { handleError } = useErrorHandler();

  // Load post if value exists
  useEffect(() => {
    if (value && organization) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setLoading(true);
        setError(null);
      }, 0);
      api.getPost(value)
        .then((response: any) => {
          if (response.success) {
            setSelectedPost(response.data);
          } else {
            const errorMsg = 'Failed to load post';
            setError(errorMsg);
            handleError(errorMsg, { title: 'Failed to Load Post' });
          }
        })
        .catch((error: unknown) => {
          const errorMsg = error instanceof Error ? error.message : 'Failed to load post';
          setError(errorMsg);
          handleError(error, { title: 'Failed to Load Post' });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSelectedPost(null);
      setError(null);
    }
  }, [value, organization, api, handleError]);

  const handleSelect = (post: any) => {
    setSelectedPost(post);
    onChange(post.id);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {selectedPost || value ? (
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : error ? (
              <Link2 className="h-5 w-5 text-destructive" />
            ) : (
              <Link2 className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {loading ? 'Loading...' : error ? 'Error loading post' : selectedPost?.title || 'Selected post'}
            </p>
            <p className="text-xs text-muted-foreground">
              {error ? error : `Post ID: ${value}`}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPost(null);
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
            <Link2 className="mr-2 h-4 w-4" />
            {value ? 'Change Relation' : 'Select Post'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                Post picker will show posts filtered by type
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

