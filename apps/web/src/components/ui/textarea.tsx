import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: boolean;
  errorMessage?: string;
  showErrorIcon?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, showErrorIcon = true, ...props }, ref) => {
    const hasError = error || props['aria-invalid'] === 'true';
    
    return (
      <div className="relative w-full">
        <textarea
          data-slot="textarea"
          ref={ref}
          aria-invalid={hasError ? 'true' : 'false'}
          className={cn(
            "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasError && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50",
            showErrorIcon && hasError && "pr-9",
            className
          )}
          {...props}
        />
        {showErrorIcon && hasError && (
          <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-destructive pointer-events-none" />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea }
