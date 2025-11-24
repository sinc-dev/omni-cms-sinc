import { useCallback } from 'react';
import { z } from 'zod';
import type { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { validateJsonString } from '@/lib/utils/validation';

/**
 * Custom hook for form validation utilities
 */
export function useFormValidation<T extends FieldValues>(form: UseFormReturn<T>) {
  /**
   * Validate a single field
   */
  const validateField = useCallback(
    async (fieldName: Path<T>) => {
      return form.trigger(fieldName);
    },
    [form]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback(async () => {
    return form.trigger();
  }, [form]);

  /**
   * Get field error message
   */
  const getFieldError = useCallback(
    (fieldName: Path<T>): string | undefined => {
      const error = form.formState.errors[fieldName];
      return error?.message as string | undefined;
    },
    [form]
  );

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback(
    (fieldName: Path<T>): boolean => {
      return !!form.formState.errors[fieldName];
    },
    [form]
  );

  /**
   * Check if form is valid
   */
  const isFormValid = useCallback((): boolean => {
    return form.formState.isValid;
  }, [form]);

  /**
   * Validate JSON field
   */
  const validateJsonField = useCallback(
    (fieldName: Path<T>, value: string) => {
      const result = validateJsonString(value);
      if (!result.success) {
        form.setError(fieldName, {
          type: 'manual',
          message: result.error || 'Invalid JSON format',
        });
        return false;
      }
      form.clearErrors(fieldName);
      return true;
    },
    [form]
  );

  /**
   * Set custom field error
   */
  const setFieldError = useCallback(
    (fieldName: Path<T>, message: string) => {
      form.setError(fieldName, {
        type: 'manual',
        message,
      });
    },
    [form]
  );

  /**
   * Clear field error
   */
  const clearFieldError = useCallback(
    (fieldName: Path<T>) => {
      form.clearErrors(fieldName);
    },
    [form]
  );

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    form.clearErrors();
  }, [form]);

  /**
   * Get all errors as a record
   */
  const getAllErrors = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    Object.keys(form.formState.errors).forEach((key) => {
      const error = form.formState.errors[key as Path<T>];
      if (error?.message) {
        errors[key] = error.message as string;
      }
    });
    return errors;
  }, [form]);

  return {
    validateField,
    validateAll,
    getFieldError,
    hasFieldError,
    isFormValid,
    validateJsonField,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    getAllErrors,
    errors: form.formState.errors,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
  };
}

