'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    /** Optional class name for custom styling */
    className?: string;
    /** Show required indicator */
    required?: boolean;
    /** Error state styling */
    error?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, required, error, children, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive',
                className
            )}
            {...props}
        >
            {children}
            {required && <span className="text-destructive ml-1">*</span>}
        </label>
    ),
);
Label.displayName = 'Label';

export { Label };
