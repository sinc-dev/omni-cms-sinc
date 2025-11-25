'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Blocks,
  FileText,
  Image,
  Video,
  Code,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Spinner } from '@/components/ui/spinner';

interface ContentBlock {
  id: string;
  name: string;
  slug: string;
  blockType: string;
  content: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const blockTypeIcons: Record<string, typeof Blocks> = {
  text: FileText,
  image: Image,
  video: Video,
  gallery: Image,
  cta: Blocks,
  code: Code,
  embed: Blocks,
};

export default function ContentBlocksPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    blockType: 'text',
    content: {} as Record<string, unknown>,
  });

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchBlocks = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {};
      if (search) params.search = search;

      const response = (await api.getContentBlocks(params)) as { success: boolean; data: ContentBlock[] };
      
      if (response.success) {
        setBlocks(response.data);
      } else {
        handleError('Failed to load content blocks', { title: 'Failed to Load Content Blocks' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Content Blocks' });

    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, search, api]);

  const handleCreate = withErrorHandling(async () => {
    if (editingBlock) {
      await api.updateContentBlock(editingBlock.id, formData);
    } else {
      await api.createContentBlock(formData);
    }
    setIsDialogOpen(false);
    setEditingBlock(null);
    setFormData({ name: '', slug: '', blockType: 'text', content: {} });
    // Refresh list
    const response = (await api.getContentBlocks()) as { success: boolean; data: ContentBlock[] };
    if (response.success) {
      setBlocks(response.data);
    }
  }, { title: 'Failed to Save Content Block' });

  const handleDelete = withErrorHandling(async (id: string) => {
    if (!confirm('Are you sure you want to delete this content block?')) return;

    await api.deleteContentBlock(id);
    setBlocks(blocks.filter(b => b.id !== id));
  }, { title: 'Failed to Delete Content Block' });

  const handleEdit = (block: ContentBlock) => {
    setEditingBlock(block);
    setFormData({
      name: block.name,
      slug: block.slug,
      blockType: block.blockType,
      content: block.content,
    });
    setIsDialogOpen(true);
  };

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view content blocks.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Blocks</h1>
          <p className="text-muted-foreground">
            Create reusable content components for your posts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBlock(null);
              setFormData({ name: '', slug: '', blockType: 'text', content: {} });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Block
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingBlock ? 'Edit Content Block' : 'Create Content Block'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Hero Section"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="hero-section"
                />
              </div>
              <div>
                <Label htmlFor="blockType">Block Type</Label>
                <select
                  id="blockType"
                  title="Block Type"
                  aria-label="Block Type"
                  value={formData.blockType}
                  onChange={(e) => setFormData({ ...formData, blockType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gallery">Gallery</option>
                  <option value="cta">Call to Action</option>
                  <option value="code">Code</option>
                  <option value="embed">Embed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  {editingBlock ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Blocks</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search blocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No content blocks found. Create your first block to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {blocks.map((block) => {
                const Icon = blockTypeIcons[block.blockType] || Blocks;
                return (
                  <div
                    key={block.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold">{block.name}</h3>
                          <p className="text-sm text-muted-foreground">{block.slug}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(block)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(block.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {block.blockType}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

