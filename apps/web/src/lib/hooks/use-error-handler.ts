'use client';

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api-client/errors';
import { useToastHelpers } from './use-toast';

/**
 * Hook for consistent error handling across admin pages
 * Provides error state management and toast notifications
 */
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  const toast = useToastHelpers();

  /**
   * Handle an error, displaying it via toast and setting error state
   */
  const handleError = useCallback(
    (err: unknown, options?: { showToast?: boolean; title?: string }) => {
      const { showToast = true, title = 'Error' } = options || {};

      let errorMessage = 'An unexpected error occurred';

      if (err instanceof ApiError) {
        errorMessage = err.message;
        
        // Show more detailed error for validation errors
        if (err.code === 'VALIDATION_ERROR' && err.details) {
          const details = err.details as Array<{ path: string[]; message: string }> | undefined;
          if (details && details.length > 0) {
            errorMessage = details.map((d) => `${d.path.join('.')}: ${d.message}`).join(', ');
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
      }

      setError(errorMessage);

      if (showToast) {
        toast.error(errorMessage, title);
      }

      // Log error for debugging
      console.error('Error handled:', err);
    },
    [toast]
  );

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(
      fn: T,
      options?: { showToast?: boolean; title?: string }
    ) => {
      return (async (...args: Parameters<T>) => {
        try {
          clearError();
          return await fn(...args);
        } catch (err) {
          handleError(err, options);
          throw err; // Re-throw to allow caller to handle if needed
        }
      }) as T;
    },
    [handleError, clearError]
  );

  return {
    error,
    handleError,
    clearError,
    withErrorHandling,
  };
}

