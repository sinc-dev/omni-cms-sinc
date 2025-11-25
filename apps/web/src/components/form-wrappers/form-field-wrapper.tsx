'use client';

import { FieldPath, FieldValues } from 'react-hook-form';
import { FormField as BaseFormField } from '@/components/ui/form';
import * as React from 'react';

interface FormFieldWrapperProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  children: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    error: { message?: string } | undefined;
    invalid: boolean;
  }) => React.ReactNode;
}

// Type assertion to make TypeScript accept children instead of render
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, children }: FormFieldWrapperProps<TFieldValues, TName>) {
  return (
    <BaseFormField
      name={name}
      render={({ field, fieldState }) => {
        return <>{children({
          value: field.value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          error: fieldState.error,
          invalid: !!fieldState.error,
        })}</>;
      }}
    />
  );
}

