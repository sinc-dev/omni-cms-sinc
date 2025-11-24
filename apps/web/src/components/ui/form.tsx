'use client';

import * as React from 'react';
import { useForm, UseFormReturn, FieldValues, Path, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

// Form Context
const FormContext = React.createContext<UseFormReturn<FieldValues> | null>(null);

function useFormContext() {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within a Form component');
  }
  return context;
}

// Form Provider Component
interface FormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
}

function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  mode = 'onBlur',
}: FormProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as T,
    mode,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <FormContext.Provider value={form as UseFormReturn<FieldValues>}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Form Field Component
interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  children: (field: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    error?: string;
    invalid: boolean;
  }) => React.ReactNode;
}

function FormField<T extends FieldValues>({ name, children }: FormFieldProps<T>) {
  const form = useFormContext() as UseFormReturn<T>;
  const fieldState = form.getFieldState(name as Path<T>);
  const fieldValue = form.watch(name as Path<T>);

  return (
    <Controller
      control={form.control}
      name={name as Path<T>}
      render={({ field, fieldState: state }) => {
        return (
          <>
            {children({
              value: field.value,
              onChange: field.onChange,
              onBlur: field.onBlur,
              error: state.error?.message,
              invalid: !!state.error,
            })}
          </>
        );
      }}
    />
  );
}

// Form Item Component
interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

function FormItem({ children, className }: FormItemProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

// Form Label Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

function FormLabel({ className, required, error, children, ...props }: FormLabelProps) {
  return (
    <Label
      className={cn(
        error && 'text-destructive',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
}

// Form Control Component
interface FormControlProps {
  children: React.ReactNode;
  error?: boolean;
}

function FormControl({ children, error, ...props }: FormControlProps) {
  return (
    <div className="relative" {...props}>
      {React.cloneElement(children as React.ReactElement, {
        'aria-invalid': error ? 'true' : 'false',
        className: cn(
          (children as React.ReactElement).props.className,
          error && 'border-destructive focus-visible:border-destructive'
        ),
      })}
    </div>
  );
}

// Form Description Component
interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </p>
  );
}

// Form Message Component
interface FormMessageProps {
  error?: string;
  className?: string;
}

function FormMessage({ error, className }: FormMessageProps) {
  if (!error) return null;

  return (
    <div className={cn('flex items-center gap-1.5 text-sm text-destructive', className)}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

// Form Error Summary Component
interface FormErrorSummaryProps {
  errors: Record<string, { message?: string }>;
  className?: string;
}

function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([, error]) => error?.message);

  if (errorEntries.length === 0) return null;

  return (
    <div className={cn('rounded-md bg-destructive/10 p-3 space-y-1', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>Please fix the following errors:</span>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
        {errorEntries.map(([field, error]) => (
          <li key={field}>
            <strong>{field}:</strong> {error.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Export hook for accessing form outside of Form component
function useFormState<T extends FieldValues>() {
  const form = useFormContext() as UseFormReturn<T>;
  return {
    form,
    errors: form.formState.errors,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
  };
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormErrorSummary,
  useFormState,
  useFormContext,
};

