'use client';

export const runtime = 'edge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-500/10 p-3">
              <ShieldX className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium mb-1">What you can do:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Contact your administrator to request access</li>
              <li>Check if you're signed in with the correct account</li>
              <li>Return to a page you have access to</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

