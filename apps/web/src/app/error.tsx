'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Something Went Wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            An unexpected error occurred. Our team has been notified and is working on a fix.
          </p>

          {/* Show configuration-specific help */}
          {error.message?.includes('Database not configured') && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-medium mb-2 text-amber-900 dark:text-amber-200">
                Configuration Issue Detected
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                The D1 database binding is not configured. Please configure it in Cloudflare Pages:
              </p>
              <ol className="text-xs text-amber-800 dark:text-amber-300 mt-2 ml-4 list-decimal space-y-1">
                <li>Go to Cloudflare Dashboard → Pages → omni-cms-sinc</li>
                <li>Settings → Functions → D1 Database bindings</li>
                <li>Add binding: Variable name = DB, Database = omni-cms</li>
              </ol>
            </div>
          )}

          {error.message?.includes('Cloudflare Access not configured') && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-medium mb-2 text-amber-900 dark:text-amber-200">
                Configuration Issue Detected
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Cloudflare Access environment variables are missing. Please set them in Cloudflare Pages:
              </p>
              <ol className="text-xs text-amber-800 dark:text-amber-300 mt-2 ml-4 list-decimal space-y-1">
                <li>Go to Cloudflare Dashboard → Pages → omni-cms-sinc</li>
                <li>Settings → Environment Variables → Production</li>
                <li>Add CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD</li>
              </ol>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium mb-2">Error Details (Development Only):</p>
              <pre className="text-xs overflow-auto max-h-32">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              If the problem persists, please contact support with the error details above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

