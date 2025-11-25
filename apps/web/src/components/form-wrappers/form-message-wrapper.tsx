'use client';

import { FormMessage as BaseFormMessage } from '@/components/ui/form';

interface FormMessageWrapperProps extends React.ComponentProps<typeof BaseFormMessage> {
  error?: any;
}

export function FormMessage({ error, ...props }: FormMessageWrapperProps) {
  return <BaseFormMessage {...props} />;
}

