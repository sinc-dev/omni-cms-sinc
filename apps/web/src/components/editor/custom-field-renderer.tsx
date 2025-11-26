'use client';

import { useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  let settings: Record<string, unknown> = {};
  try {
    settings = field.settings ? JSON.parse(field.settings) : {};
  } catch (error) {
    console.error('Failed to parse field settings:', error, field);
    // Use empty settings as fallback
    settings = {};
  }
  const placeholder = (settings.placeholder as string) || '';
  const required = settings.required === true;
  const minLength = settings.minLength as number | undefined;
  const maxLength = settings.maxLength as number | undefined;
  const min = settings.min as number | undefined;
  const max = settings.max as number | undefined;
  const pattern = settings.pattern as string | undefined;
  const patternErrorMessage = (settings.patternErrorMessage as string) || 'Invalid format';

  // Validation function
  const validate = (val: unknown): string | null => {
    if (required) {
      if (val === null || val === undefined || val === '') {
        return `${field.name} is required`;
      }
      if (Array.isArray(val) && val.length === 0) {
        return `${field.name} is required`;
      }
    }

    if (val === null || val === undefined || val === '') {
      return null; // Empty values are only invalid if required
    }

    const stringValue = String(val);

    if (minLength !== undefined && stringValue.length < minLength) {
      return `${field.name} must be at least ${minLength} characters`;
    }

    if (maxLength !== undefined && stringValue.length > maxLength) {
      return `${field.name} must be no more than ${maxLength} characters`;
    }

    if (pattern && !new RegExp(pattern).test(stringValue)) {
      return patternErrorMessage;
    }

    if (field.fieldType === 'number') {
      const numValue = typeof val === 'number' ? val : Number(val);
      if (isNaN(numValue)) {
        return `${field.name} must be a valid number`;
      }
      if (min !== undefined && numValue < min) {
        return `${field.name} must be at least ${min}`;
      }
      if (max !== undefined && numValue > max) {
        return `${field.name} must be no more than ${max}`;
      }
    }

    if (field.fieldType === 'email' && stringValue) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(stringValue)) {
        return 'Please enter a valid email address';
      }
    }

    if (field.fieldType === 'url' && stringValue) {
      try {
        if (!stringValue.startsWith('/')) {
          new URL(stringValue);
        }
      } catch {
        return 'Please enter a valid URL';
      }
    }

    return null;
  };

  const handleChange = (newValue: unknown) => {
    onChange(newValue);
    if (touched) {
      setError(validate(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(value));
  };

  const renderField = () => {
    switch (field.fieldType) {
      case 'text':
        return (
          <Input
            id={field.slug}
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.slug}
            placeholder={placeholder}
            value={String(value || '')}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            rows={4}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
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
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null)}
            onBlur={handleBlur}
            required={required}
            min={min}
            max={max}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
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
            onChange={(e) => handleChange(e.target.value || null)}
            onBlur={handleBlur}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
          />
        );

      case 'datetime':
        return (
          <Input
            id={field.slug}
            type="datetime-local"
            value={value ? String(value).replace('Z', '').slice(0, 16) : ''}
            onChange={(e) => handleChange(e.target.value || null)}
            onBlur={handleBlur}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
          />
        );

      case 'media':
        return (
          <div>
            <MediaPicker
              value={value ? String(value) : null}
              onChange={(mediaId) => handleChange(mediaId)}
            />
          </div>
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
        const options = Array.isArray(settings.options) ? settings.options : [];
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
            onChange={(e) => handleChange(e.target.value || null)}
            onBlur={handleBlur}
            required={required}
            {...(error ? { 'aria-invalid': true } : {})}
            aria-describedby={error ? `${field.slug}-error` : undefined}
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
        const multiOptions = Array.isArray(settings.options) ? settings.options : [];
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
                      handleChange([...selectedValues, opt]);
                    } else {
                      handleChange(selectedValues.filter((v) => v !== opt));
                    }
                  }}
                  onBlur={handleBlur}
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
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.slug}-error` : undefined}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.slug} className={error ? 'text-destructive' : ''}>
        {field.name}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      {error && (
        <p id={`${field.slug}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!error && (() => {
        const description = settings.description;
        return description && typeof description === 'string' ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null;
      })()}
    </div>
  );
}

