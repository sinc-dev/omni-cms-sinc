'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, FileText } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useSchema } from '@/lib/context/schema-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  postType: {
    id: string;
    name: string;
    slug: string;
  };
}

interface RelationshipSelectorProps {
  fromPostId: string;
  onRelationshipCreated?: () => void;
}

export function RelationshipSelector({
  fromPostId,
  onRelationshipCreated,
}: RelationshipSelectorProps) {
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { getRelationshipTypes } = useSchema();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const relationshipTypes = getRelationshipTypes();
  const [relationshipType, setRelationshipType] = useState<string>('');
  
  // Update relationshipType when relationshipTypes are loaded
  useEffect(() => {
    if (relationshipTypes.length > 0 && !relationshipType) {
      // Use setTimeout to avoid setState in effect
      setTimeout(() => {
        setRelationshipType(relationshipTypes[0]);
      }, 0);
    }
  }, [relationshipTypes, relationshipType]);

  useEffect(() => {
    if (!open) return;

    const fetchPosts = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = await api.getPosts();
      const data = response as { success: boolean; data: Post[] };

      if (data.success) {
        // Filter out the current post
        setPosts(data.data.filter((p) => p.id !== fromPostId));
      }

      setLoading(false);
    }, { title: 'Failed to Load Posts' });

    fetchPosts();
  }, [open, fromPostId, api, withErrorHandling, clearError]);

  const handleCreate = withErrorHandling(async () => {
    if (!selectedPostId) return;

    setSaving(true);
    clearError();

    await api.createPostRelationship(fromPostId, {
      toPostId: selectedPostId,
      relationshipType,
    });

    setSaving(false);
    setSelectedPostId('');
    setRelationshipType(relationshipTypes.length > 0 ? relationshipTypes[0] : '');
    setOpen(false);
    
    if (onRelationshipCreated) {
      onRelationshipCreated();
    }
  }, { title: 'Failed to Create Relationship' });

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase()) ||
      post.postType.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Relationship
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Post Relationship</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Relationship Type */}
          <div className="space-y-2">
            <Label htmlFor="relationshipType">Relationship Type</Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger id="relationshipType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {relationshipTypes.length === 0 ? (
                  <SelectItem value="" disabled>No relationship types available</SelectItem>
                ) : (
                  relationshipTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Post Selection */}
          <div className="space-y-2">
            <Label>Select Post</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading posts...</p>
            ) : filteredPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search ? 'No posts match your search.' : 'No posts available.'}
              </p>
            ) : (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                    className={`
                      w-full text-left p-3 hover:bg-muted transition-colors
                      ${selectedPostId === post.id ? 'bg-muted border-l-2 border-primary' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{post.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {post.postType.name} • {post.status}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {post.slug}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !selectedPostId}>
              {saving ? 'Creating...' : 'Create Relationship'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

