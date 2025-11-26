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
  Webhook,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useToastHelpers } from '@/lib/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebhooksPage() {
  const { organization } = useOrganization();
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const { success: showSuccess } = useToastHelpers();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [webhookToDelete, setWebhookToDelete] = useState<Webhook | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    active: true,
  });

  const availableEvents = [
    'post.created',
    'post.updated',
    'post.published',
    'post.deleted',
    'media.uploaded',
    'user.created',
  ];

  useEffect(() => {
    if (!organization) {
      setLoading(false);
      return;
    }

    const fetchWebhooks = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const response = (await api.getWebhooks({ search })) as { success: boolean; data: Webhook[] };
      
      if (response.success) {
        setWebhooks(response.data);
      } else {
        handleError('Failed to load webhooks', { title: 'Failed to Load Webhooks' });
      }
      setLoading(false);
    }, { title: 'Failed to Load Webhooks' });

    fetchWebhooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, search, api]);

  const handleCreate = withErrorHandling(async () => {
    if (editingWebhook) {
      await api.updateWebhook(editingWebhook.id, formData);
      showSuccess(`Webhook "${formData.name}" updated successfully`, 'Webhook Updated');
    } else {
      await api.createWebhook(formData);
      showSuccess(`Webhook "${formData.name}" created successfully`, 'Webhook Created');
    }
    setIsDialogOpen(false);
    setEditingWebhook(null);
    setFormData({ name: '', url: '', events: [], active: true });
    // Refresh list
    const response = (await api.getWebhooks()) as { success: boolean; data: Webhook[] };
    if (response.success) {
      setWebhooks(response.data);
    }
  }, { title: 'Failed to Save Webhook' });

  const handleDelete = withErrorHandling(async (id: string) => {
    const deletedWebhook = webhookToDelete || webhooks.find(w => w.id === id);
    const deletedName = deletedWebhook?.name || 'Webhook';
    await api.deleteWebhook(id);
    setWebhooks(webhooks.filter(w => w.id !== id));
    setWebhookToDelete(null);
    showSuccess(`Webhook "${deletedName}" deleted successfully`, 'Webhook Deleted');
  }, { title: 'Failed to Delete Webhook' });

  const handleTest = withErrorHandling(async (id: string) => {
    await api.testWebhook(id);
  }, { title: 'Failed to Test Webhook' });

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
    });
    setIsDialogOpen(true);
  };

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  if (!organization) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Please select an organization to view webhooks.
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
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Manage webhooks to receive notifications on content changes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingWebhook(null);
              setFormData({ name: '', url: '', events: [], active: true });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Webhook"
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <Label>Events</Label>
                <div className="mt-2 space-y-2">
                  {availableEvents.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Checkbox
                        id={event}
                        checked={formData.events.includes(event)}
                        onCheckedChange={() => toggleEvent(event)}
                      />
                      <Label htmlFor={event} className="font-normal cursor-pointer">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked === true })}
                />
                <Label htmlFor="active" className="font-normal cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  {editingWebhook ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Webhooks</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search webhooks..."
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
          ) : webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No webhooks found. Create your first webhook to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Webhook className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{webhook.name}</h3>
                      {webhook.active ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{webhook.url}</p>
                    <div className="flex gap-2 mt-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(webhook)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTest(webhook.id)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Test
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setWebhookToDelete(webhook);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (!webhookToDelete) return;
          await handleDelete(webhookToDelete.id);
        }}
        title="Delete Webhook"
        description="Are you sure you want to delete this webhook? This action cannot be undone."
        itemName={webhookToDelete ? `"${webhookToDelete.name}"` : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

