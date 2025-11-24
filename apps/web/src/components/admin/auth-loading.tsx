'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface AuthLoadingProps {
  message?: string;
  className?: string;
}

export function AuthLoading({ 
  message = 'Validating authentication...',
  className 
}: AuthLoadingProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center p-4 bg-background ${className}`}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

