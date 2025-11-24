'use client';

export const runtime = 'edge';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  FileText,
  Copy,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { Spinner } from '@/components/ui/spinner';

interface Template {
  id: string;
  name: string;
  slug: string;
  postTypeId: string;
  content: Record<string, unknown>;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  postType?: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function TemplatesPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    postTypeId: '',
    content: {} as Record<string, unknown>,
    customFields: {} as Record<string, unknown>,
  });

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchTemplates = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const params: Record<string, string> = {};
      if (search) params.search = search;

      const response = (await api.getTemplates(params)) as { success: boolean; data: Template[] };
      
      if (response.success) {
        setTemplates(response.data);
      } else {
        handleError('Failed to load templates', { title: 'Failed to Load Templates' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Templates' });

    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, search, api]);

  const handleCreate = withErrorHandling(async () => {
    if (editingTemplate) {
      await api.updateTemplate(editingTemplate.id, formData);
    } else {
      await api.createTemplate(formData);
    }
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({ name: '', slug: '', postTypeId: '', content: {}, customFields: {} });
    // Refresh list
    const response = (await api.getTemplates()) as { success: boolean; data: Template[] };
    if (response.success) {
      setTemplates(response.data);
    }
  }, { title: 'Failed to Save Template' });

  const handleDelete = withErrorHandling(async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    await api.deleteTemplate(id);
    setTemplates(templates.filter(t => t.id !== id));
  }, { title: 'Failed to Delete Template' });

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      postTypeId: template.postTypeId,
      content: template.content,
      customFields: template.customFields,
    });
    setIsDialogOpen(true);
  };

  const handleCreateFromTemplate = withErrorHandling(async (templateId: string) => {
    const response = await api.createPostFromTemplate({ templateId });
    if (response && typeof response === 'object' && 'data' in response) {
      const post = (response as { data: { id: string } }).data;
      window.location.href = `/admin/posts/${post.id}/edit`;
    }
  }, { title: 'Failed to Create Post from Template' });

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view templates.
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
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Create reusable post templates for faster content creation
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTemplate(null);
              setFormData({ name: '', slug: '', postTypeId: '', content: {}, customFields: {} });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Blog Post Template"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="blog-post-template"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Templates</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
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
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No templates found. Create your first template to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {template.postType?.name || 'Unknown Type'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCreateFromTemplate(template.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Create Post
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

