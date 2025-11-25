'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { useOrganization } from '@/lib/context/organization-context';
import { SchemaProvider } from '@/lib/context/schema-context';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/errors';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function OrgLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params.orgId as string;
  const { setOrganizations, setOrganization } = useOrganization();
  const isRedirectingRef = useRef(false);
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Don't make API calls if we're on an error page
    if (pathname === '/unauthorized' || pathname === '/forbidden') {
      setIsValidating(false);
      return;
    }

    // Prevent multiple simultaneous requests if redirecting
    if (isRedirectingRef.current) {
      return;
    }

    // Check sessionStorage for redirect flag
    if (typeof window !== 'undefined' && sessionStorage.getItem('omni-cms:redirecting') === 'true') {
      return;
    }

    const validateOrgAccess = async () => {
      try {
        // Fetch user's organizations
        const response = await apiClient.getOrganizations() as {
          success: boolean;
          data: Organization[];
        };

        if (response.success && response.data) {
          const orgs = response.data;
          setOrganizations(orgs);

          // Check if user has access to the orgId in URL
          const org = orgs.find((o) => o.id === orgId);
          
          if (org) {
            setOrganization(org);
            setHasAccess(true);
          } else {
            // User doesn't have access to this org
            // Redirect to select-organization or first available org
            if (orgs.length > 0) {
              router.replace(`/${orgs[0].id}/dashboard`);
            } else {
              router.replace('/select-organization');
            }
            return;
          }
        } else {
          // No organizations, redirect to selection
          router.replace('/select-organization');
          return;
        }
      } catch (error) {
        // Check if it's a 401 error - redirect will happen in API client
        if (error instanceof ApiError && error.status === 401) {
          isRedirectingRef.current = true;
          // Redirect will happen in API client, just return early
          return;
        }
        console.error('Failed to validate organization access:', error);
        router.replace('/select-organization');
        return;
      } finally {
        setIsValidating(false);
      }
    };

    if (orgId) {
      validateOrgAccess();
    } else {
      router.replace('/select-organization');
    }
  }, [orgId, pathname, router, setOrganizations, setOrganization]); // Depend on orgId, pathname, and context setters

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirect is happening
  }

  return (
    <ErrorBoundary>
      <SchemaProvider>
        <ToastProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6" role="main">
                <Breadcrumbs />
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ToastProvider>
      </SchemaProvider>
    </ErrorBoundary>
  );
}

