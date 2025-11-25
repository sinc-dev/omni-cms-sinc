'use client';

import { useForm, FieldValues, useFormContext, DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormProvider } from 'react-hook-form';

interface FormWrapperProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T> | T;
  onSubmit: (data: T) => Promise<void> | void;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  children: React.ReactNode;
}

export function Form<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  mode = 'onBlur',
  children,
}: FormWrapperProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode,
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data as T);
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit}>{children}</form>
    </FormProvider>
  );
}

export function useFormState<T extends FieldValues = FieldValues>() {
  const form = useFormContext<T>();
  return {
    form,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
    errors: form.formState.errors as Record<string, { message?: string }>,
  };
}

