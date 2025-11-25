'use client';

import { FormLabel as BaseFormLabel } from '@/components/ui/form';
import { cn } from '@/lib/utils';

interface FormLabelWrapperProps extends React.ComponentProps<typeof BaseFormLabel> {
  required?: boolean;
  error?: boolean;
}

export function FormLabel({ required, error, className, children, ...props }: FormLabelWrapperProps) {
  return (
    <BaseFormLabel
      className={cn(error && 'text-destructive', className)}
      {...props}
    >
      {required && <span className="text-destructive mr-1">*</span>}
      {children}
    </BaseFormLabel>
  );
}

