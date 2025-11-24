// Re-export toast hook for convenience
export { useToast } from '@/components/ui/toast';

// Helper functions for common toast notifications
import { useToast as useToastHook } from '@/components/ui/toast';
import type { ToastVariant } from '@/components/ui/toast';

export function useToastHelpers() {
  const { addToast } = useToastHook();

  return {
    success: (message: string, title?: string) => {
      addToast({ message, title, variant: 'success' });
    },
    error: (message: string, title?: string) => {
      addToast({ message, title, variant: 'error' });
    },
    info: (message: string, title?: string) => {
      addToast({ message, title, variant: 'info' });
    },
    warning: (message: string, title?: string) => {
      addToast({ message, title, variant: 'warning' });
    },
  };
}

