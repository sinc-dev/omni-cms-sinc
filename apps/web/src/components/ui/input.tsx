import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean;
  errorMessage?: string;
  showErrorIcon?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, showErrorIcon = true, ...props }, ref) => {
    const hasError = error || props['aria-invalid'] === 'true';
    
    return (
      <div className="relative w-full">
        <input
          type={type}
          data-slot="input"
          ref={ref}
          aria-invalid={hasError ? 'true' : 'false'}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50",
            showErrorIcon && hasError && "pr-9",
            className
          )}
          {...props}
        />
        {showErrorIcon && hasError && (
          <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive pointer-events-none" />
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input }
