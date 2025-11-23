import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
            checked === 'indeterminate' && 'data-[state=indeterminate]:bg-primary',
            className
          )}
          ref={ref}
          checked={checked === true}
          data-state={checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
          onChange={handleChange}
          {...props}
        />
        {checked === true && (
          <Check className="absolute left-0.5 top-0.5 h-3 w-3 text-primary-foreground pointer-events-none" />
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };

