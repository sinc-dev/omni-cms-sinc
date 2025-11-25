'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

interface ErrorCardProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function ErrorCard({ 
  title = 'An Error Occurred',
  message = 'Something went wrong. Please try again.',
  error,
  onRetry,
  showDetails = process.env.NODE_ENV === 'development',
  actions,
  className 
}: ErrorCardProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>

        {showDetails && errorMessage && (
          <details className="rounded-md bg-muted p-3 text-xs">
            <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
              {errorMessage}
              {error instanceof Error && error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex gap-2">
          {actions || (
            <>
              {onRetry && (
                <Button onClick={onRetry} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
              {!onRetry && (
                <Button onClick={() => window.location.reload()} size="sm" variant="outline">
                  Refresh Page
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

