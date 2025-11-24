'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSchema } from '@/lib/context/schema-context';

interface PostTypeField {
  id: string;
  postTypeId: string;
  customFieldId: string;
  isRequired: boolean;
  defaultValue?: string | null;
  order: number;
  createdAt: string;
  customField: {
    id: string;
    name: string;
    slug: string;
    fieldType: string;
    settings?: string | null;
  };
}

interface FieldListProps {
  fields: PostTypeField[];
  onDetach: (fieldId: string) => Promise<void>;
  onReorder: (fieldOrders: Array<{ fieldId: string; order: number }>) => Promise<void>;
}

function SortableFieldItem({
  field,
  onDetach,
}: {
  field: PostTypeField;
  onDetach: (fieldId: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { getFieldTypeColor } = useSchema();

  const getFieldTypeBadgeColor = (fieldType: string) => {
    // Convert hex color to Tailwind classes
    const hexColor = getFieldTypeColor(fieldType);
    // Map common hex colors to Tailwind classes
    const colorMap: Record<string, string> = {
      '#3b82f6': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      '#10b981': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      '#f59e0b': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#ef4444': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      '#8b5cf6': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      '#ec4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      '#06b6d4': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      '#84cc16': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
      '#f97316': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      '#6366f1': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colorMap[hexColor] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card',
        isDragging && 'shadow-lg'
      )}
      // Inline style required for drag-and-drop positioning
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{field.customField.name}</span>
          {field.isRequired && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Required
            </Badge>
          )}
          <Badge className={cn('text-xs', getFieldTypeBadgeColor(field.customField.fieldType))}>
            {field.customField.fieldType}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground font-mono mt-1">
          {field.customField.slug}
        </div>
        {field.defaultValue && (
          <div className="text-xs text-muted-foreground mt-1">
            Default: {field.defaultValue}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={() => onDetach(field.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function FieldList({ fields, onDetach, onReorder }: FieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      const newFields = arrayMove(fields, oldIndex, newIndex);
      
      // Update order values
      const fieldOrders = newFields.map((field, index) => ({
        fieldId: field.id,
        order: index,
      }));

      onReorder(fieldOrders);
    }
  };

  if (fields.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        <p>No fields attached to this post type.</p>
        <p className="mt-1">Click &quot;Attach Field&quot; to add custom fields.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableFieldItem key={field.id} field={field} onDetach={onDetach} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

