'use client';

import { ReactNode, useEffect, useState, useRef, startTransition } from 'react';
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
  const { organizations: cachedOrgs, isLoading: orgsLoading, setOrganization } = useOrganization();
  const isRedirectingRef = useRef(false);
  const hasValidatedRef = useRef(false);
  const [isValidating, setIsValidating] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Don't validate if on error pages
    if (pathname === '/unauthorized' || pathname === '/forbidden') {
      startTransition(() => {
        setIsValidating(false);
      });
      return;
    }

    // Skip if already validated for this org
    if (hasValidatedRef.current && hasAccess) {
      startTransition(() => {
        setIsValidating(false);
      });
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

    // Wait for organizations to load from context
    if (orgsLoading) {
      setIsValidating(true);
      return;
    }

    // Validate using cached organizations from context
    if (orgId && cachedOrgs.length >= 0) {
      setIsValidating(true);

      // Check if user has access to the orgId in URL
      const org = cachedOrgs.find((o) => o.id === orgId);
      
      if (org) {
        setOrganization(org);
        setHasAccess(true);
        hasValidatedRef.current = true;
        setIsValidating(false);
      } else {
        // User doesn't have access to this org
        // Redirect to select-organization or first available org
        if (cachedOrgs.length > 0) {
          router.replace(`/${cachedOrgs[0].id}/dashboard`);
        } else {
          router.replace('/select-organization');
        }
        setIsValidating(false);
        return;
      }
    } else if (!orgId) {
      router.replace('/select-organization');
      setIsValidating(false);
    } else if (cachedOrgs.length === 0 && !orgsLoading) {
      // No organizations, redirect to selection
      router.replace('/select-organization');
      setIsValidating(false);
    }
  }, [orgId, pathname, cachedOrgs, orgsLoading, hasAccess, router, setOrganization]);

  if (isValidating) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Validating organization access...</p>
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

