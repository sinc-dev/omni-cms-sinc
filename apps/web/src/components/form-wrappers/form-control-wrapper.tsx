'use client';

import { FormControl as BaseFormControl } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface FormControlWrapperProps extends React.ComponentProps<typeof BaseFormControl> {
  error?: boolean;
}

export function FormControl({ error, className, ...props }: FormControlWrapperProps) {
  return (
    <BaseFormControl
      className={cn(error && 'border-destructive', className)}
      {...props}
    />
  );
}

