'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Optimized: Direct icon imports to reduce bundle size
import ShieldX from 'lucide-react/dist/esm/icons/shield-x';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Link from 'next/link';

interface ForbiddenCardProps {
  message?: string;
  requiredPermission?: string;
  backUrl?: string;
  className?: string;
}

export function ForbiddenCard({ 
  message = "You don't have permission to access this resource.",
  requiredPermission,
  backUrl = '/select-organization',
  className 
}: ForbiddenCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldX className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle>Access Denied</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        
        {requiredPermission && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium mb-1">Required Permission:</p>
            <p className="text-xs text-muted-foreground font-mono">{requiredPermission}</p>
          </div>
        )}

        <Button variant="outline" asChild size="sm">
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

