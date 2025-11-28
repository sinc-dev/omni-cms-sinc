'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Optimized: Direct icon imports to reduce bundle size
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Home from 'lucide-react/dist/esm/icons/home';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component
 * Catches React errors and displays a user-friendly error message
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  getDashboardUrl = () => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && pathParts[0] !== 'admin' && pathParts[0] !== 'sign-in' && pathParts[0] !== 'sign-up') {
        // Check if first part looks like an orgId (UUID or slug)
        const orgId = pathParts[0];
        return `/${orgId}/dashboard`;
      }
    }
    return '/select-organization';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Something Went Wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                An unexpected error occurred. Our team has been notified and is working on a fix.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="rounded-md bg-muted p-3 text-xs">
                  <summary className="cursor-pointer font-medium mb-2">Error Details (Development Only)</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-xs">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Page
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href={this.getDashboardUrl()}>
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  If the problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

