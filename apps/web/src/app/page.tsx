"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useOrganization } from '@/lib/context/organization-context';
import { apiClient } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const { organizations, isLoading: orgsLoading } = useOrganization();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Wait a moment for organization context to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if user has session token (OTP) or Cloudflare Access cookie
      const hasSessionToken = typeof window !== 'undefined' && 
        localStorage.getItem('omni-cms:session-token') !== null;
      
      // Check if organizations are loaded (indicates authentication worked)
      if (!orgsLoading) {
        setIsChecking(false);
        
        // If user has organizations, redirect to organization selection
        if (organizations.length > 0) {
          // If exactly 1 organization, redirect to dashboard
          if (organizations.length === 1) {
            router.replace(`/${organizations[0].id}/dashboard`);
          } else {
            router.replace('/select-organization');
          }
          return;
        }
        
        // If no organizations but has session token, might be new user
        // Let them see the select-organization page with empty state
        if (hasSessionToken) {
          router.replace('/select-organization');
          return;
        }
        
        // No auth - redirect to sign-in
        router.replace('/sign-in');
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
