'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { TipTapEditor } from './tiptap-editor';
import { MediaPicker } from './media-picker';
import { RelationPicker } from './relation-picker';

interface CustomField {
  id: string;
  name: string;
  slug: string;
  fieldType: string;
  settings?: string | null;
}

interface CustomFieldRendererProps {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
  postTypeId?: string;
}

export function CustomFieldRenderer({
  field,
  value,
  onChange,
  postTypeId,
}: CustomFieldRendererProps) {
  const settings = field.settings ? JSON.parse(field.settings) : {};
  const placeholder = settings.placeholder || '';
  const required = settings.required === true;

  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
        return (
          <Input
            id={field.slug}
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.slug}
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            required={required}
          />
        );

      case 'rich_text':
        return (
          <TipTapEditor
            content={String(value || '')}
            onChange={(content) => onChange(content)}
            placeholder={placeholder || 'Enter content...'}
          />
        );

      case 'number':
        return (
          <Input
            id={field.slug}
            type="number"
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            required={required}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.slug}
              checked={Boolean(value)}
              onCheckedChange={(checked: boolean) => onChange(checked === true)}
            />
            <Label htmlFor={field.slug} className="font-normal cursor-pointer">
              {placeholder || 'Enable'}
            </Label>
          </div>
        );

      case 'date':
        return (
          <Input
            id={field.slug}
            type="date"
            value={value ? String(value).split('T')[0] : ''}
            onChange={(e) => onChange(e.target.value || null)}
            required={required}
          />
        );

      case 'datetime':
        return (
          <Input
            id={field.slug}
            type="datetime-local"
            value={value ? String(value).replace('Z', '').slice(0, 16) : ''}
            onChange={(e) => onChange(e.target.value || null)}
            required={required}
          />
        );

      case 'media':
        return (
          <MediaPicker
            value={value ? String(value) : null}
            onChange={(mediaId) => onChange(mediaId)}
          />
        );

      case 'relation':
        return (
          <RelationPicker
            value={value ? String(value) : null}
            onChange={(postId) => onChange(postId)}
            postTypeId={postTypeId}
          />
        );

      case 'select':
        const options = settings.options || [];
        const selectValue = value !== null && value !== undefined ? String(value) : '';
        // Ensure the value exists in options, otherwise show empty
        const isValidValue = !selectValue || options.includes(selectValue);
        return (
          <select
            id={field.slug}
            aria-label={field.name}
            title={field.name}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={isValidValue ? selectValue : ''}
            onChange={(e) => onChange(e.target.value || null)}
            required={required}
          >
            <option value="">Select an option...</option>
            {options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        const multiOptions = settings.options || [];
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {multiOptions.map((opt: string) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.slug}-${opt}`}
                  checked={selectedValues.includes(opt)}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      onChange([...selectedValues, opt]);
                    } else {
                      onChange(selectedValues.filter((v) => v !== opt));
                    }
                  }}
                />
                <Label
                  htmlFor={`${field.slug}-${opt}`}
                  className="font-normal cursor-pointer"
                >
                  {opt}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'json':
        return (
          <Textarea
            id={field.slug}
            placeholder={placeholder || '{"key": "value"}'}
            value={typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value || '{}'));
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={6}
            className="font-mono text-sm"
            required={required}
          />
        );

      default:
        return (
          <Input
            id={field.slug}
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            required={required}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.slug}>
        {field.name}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {settings.description && (
        <p className="text-xs text-muted-foreground">{settings.description}</p>
      )}
    </div>
  );
}

