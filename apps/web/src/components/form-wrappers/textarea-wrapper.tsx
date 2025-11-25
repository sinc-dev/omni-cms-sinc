'use client';

import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextareaWrapperProps extends React.ComponentProps<typeof BaseTextarea> {
  error?: boolean;
}

export function Textarea({ error, className, ...props }: TextareaWrapperProps) {
  return (
    <BaseTextarea
      className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
      {...props}
    />
  );
}

