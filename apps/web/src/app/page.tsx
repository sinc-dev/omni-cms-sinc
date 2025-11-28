"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { apiClient } from '@/lib/api-client';

// Force dynamic rendering to prevent static generation
// This page needs to check authentication state and redirect accordingly
export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const { organizations, isLoading: orgsLoading } = useOrganization();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait a moment for organization context to load
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if organizations are loaded (indicates authentication worked)
      if (!orgsLoading) {
        setIsChecking(false);
        
        // If user has organizations, redirect appropriately
        if (organizations.length > 0) {
          // If exactly 1 organization, redirect to dashboard
          if (organizations.length === 1) {
            router.replace(`/${organizations[0].id}/dashboard`);
          } else {
            router.replace('/select-organization');
          }
          return;
        }
        
        // No organizations loaded - could mean:
        // 1. User is authenticated but has no organizations (new user)
        // 2. User is not authenticated
        // 
        // If organizations array is empty but context finished loading without error,
        // it likely means user is authenticated but has no orgs (Cloudflare Access
        // would return 401 if not authenticated, which would be caught by api-client)
        // 
        // For OTP auth, check localStorage token
        // For Cloudflare Access, rely on the fact that getOrganizations() succeeded
        // (even with empty array) to indicate authentication
        
        // Default: redirect to select-organization (will show empty state if no orgs)
        // This handles both authenticated users with no orgs and provides a safe fallback
        router.replace('/select-organization');
      }
    };

    checkAuthAndRedirect();
  }, [orgsLoading, organizations, router]);

  // Show loading state while checking
  if (isChecking || orgsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // This should rarely render as redirects happen above
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
