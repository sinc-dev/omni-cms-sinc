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
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus } from 'lucide-react';
import { useApiClient } from '@/lib/hooks/use-api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  settings?: string | null;
}

interface FieldAttachmentDialogProps {
  postTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttached: () => void;
}

export function FieldAttachmentDialog({
  postTypeId,
  open,
  onOpenChange,
  onAttached,
}: FieldAttachmentDialogProps) {
  const api = useApiClient();
  const { error, handleError, clearError, withErrorHandling } = useErrorHandler();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [attachedFieldIds, setAttachedFieldIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [isRequired, setIsRequired] = useState(false);
  const [order, setOrder] = useState(0);
  const [defaultValue, setDefaultValue] = useState('');

  // Fetch custom fields and attached fields
  useEffect(() => {
    if (!open) return;

    const fetchData = withErrorHandling(async () => {
      setLoading(true);
      clearError();

      const [fieldsResponse, attachedResponse] = await Promise.all([
        api.getCustomFields(),
        api.getPostTypeFields(postTypeId),
      ]);

      const fieldsData = fieldsResponse as { success: boolean; data: CustomField[] };
      const attachedData = attachedResponse as { success: boolean; data: Array<{ customFieldId: string }> };

      if (fieldsData.success) {
        setCustomFields(fieldsData.data);
      }

      if (attachedData.success) {
        setAttachedFieldIds(new Set(attachedData.data.map((f) => f.customFieldId)));
      }

      setLoading(false);
    }, { title: 'Failed to Load Fields' });

    fetchData();
  }, [open, postTypeId, api, withErrorHandling, clearError]);

  const handleAttach = withErrorHandling(async () => {
    if (!selectedFieldId) return;

    setSaving(true);
    clearError();

    await api.attachFieldToPostType(postTypeId, {
      customFieldId: selectedFieldId,
      isRequired,
      order,
      defaultValue: defaultValue || undefined,
    });

    setSaving(false);
    setSelectedFieldId('');
    setIsRequired(false);
    setOrder(0);
    setDefaultValue('');
    onAttached();
  }, { title: 'Failed to Attach Field' });

  const filteredFields = customFields.filter((field) => {
    const matchesSearch =
      field.name.toLowerCase().includes(search.toLowerCase()) ||
      field.slug.toLowerCase().includes(search.toLowerCase());
    const notAttached = !attachedFieldIds.has(field.id);
    return matchesSearch && notAttached;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Attach Field
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach Field to Post Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Field Selection */}
          <div className="space-y-2">
            <Label>Select Field</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading fields...</p>
            ) : filteredFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {search
                  ? 'No available fields match your search.'
                  : 'All fields are already attached to this post type.'}
              </p>
            ) : (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredFields.map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`
                      w-full text-left p-3 hover:bg-muted transition-colors
                      ${selectedFieldId === field.id ? 'bg-muted border-l-2 border-primary' : ''}
                    `}
                  >
                    <div className="font-medium">{field.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{field.slug}</div>
                    <div className="text-xs text-muted-foreground mt-1">{field.fieldType}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Field Options */}
          {selectedFieldId && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={isRequired}
                  onCheckedChange={(checked: boolean) => setIsRequired(checked === true)}
                />
                <Label htmlFor="required" className="text-sm font-normal cursor-pointer">
                  Required field
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultValue">Default Value (optional)</Label>
                <Input
                  id="defaultValue"
                  value={defaultValue}
                  onChange={(e) => setDefaultValue(e.target.value)}
                  placeholder="Enter default value"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAttach}
              disabled={saving || !selectedFieldId}
            >
              {saving ? 'Attaching...' : 'Attach Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

