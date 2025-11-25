'use client';

import { Input as BaseInput } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputWrapperProps extends React.ComponentProps<typeof BaseInput> {
  error?: boolean;
}

export function Input({ error, className, ...props }: InputWrapperProps) {
  return (
    <BaseInput
      className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
    />
  );
}

