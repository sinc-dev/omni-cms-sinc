'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface UnauthorizedCardProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function UnauthorizedCard({ 
  message = 'You need to be authenticated to access this content.',
  onRetry,
  className 
}: UnauthorizedCardProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Authentication Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button onClick={handleRetry} size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Authentication
        </Button>
      </CardContent>
    </Card>
  );
}

