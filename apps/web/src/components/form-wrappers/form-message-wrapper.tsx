'use client';

import { FormMessage as BaseFormMessage } from '@/components/ui/form';

interface FormMessageWrapperProps extends React.ComponentProps<typeof BaseFormMessage> {
  error?: Error | string | null;
}

export function FormMessage({ error, ...props }: FormMessageWrapperProps) {
  return <BaseFormMessage {...props} />;
}

