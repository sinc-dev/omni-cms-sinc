'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/errors';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
}

export default function SelectOrganizationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { handleError } = useErrorHandler();
  const isRedirectingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    // Don't make API calls if we're on an error page
    if (pathname === '/unauthorized' || pathname === '/forbidden') {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      return;
    }

    // Early return if already fetched successfully
    if (hasFetchedRef.current && organizations.length > 0) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous requests if redirecting
    if (isRedirectingRef.current) {
      setLoading(false);
      return;
    }

    // Check sessionStorage for redirect flag
    if (typeof window !== 'undefined' && sessionStorage.getItem('omni-cms:redirecting') === 'true') {
      setLoading(false);
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchOrganizations = async () => {
      // Prevent multiple simultaneous requests
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      try {
        setLoading(true);
        const response = await apiClient.getOrganizations() as {
          success: boolean;
          data: Organization[];
        };

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        if (response.success && response.data) {
          setOrganizations(response.data);
          hasFetchedRef.current = true;
        } else {
          handleError('Failed to load organizations', { title: 'Error' });
        }
      } catch (error) {
        // Don't handle errors if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        // Check if it's a 401 error - redirect will happen in API client
        if (error instanceof ApiError && error.status === 401) {
          isRedirectingRef.current = true;
          setLoading(false);
          // Redirect will happen in API client, just return early
          return;
        }
        handleError(error, { title: 'Failed to Load Organizations' });
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    fetchOrganizations();

    // Cleanup function to abort request if component unmounts or effect re-runs
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isFetchingRef.current = false;
    };
  }, [pathname]); // Only depend on pathname - handleError is stable via useCallback

  const handleSelect = async (org: Organization) => {
    try {
      setSelecting(org.id);
      // Redirect to dashboard for the selected organization
      router.push(`/${org.id}/dashboard`);
    } catch (error) {
      handleError(error, { title: 'Failed to Select Organization' });
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle>No Organizations</CardTitle>
            </div>
            <CardDescription>
              You don&apos;t have access to any organizations yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please contact your administrator to be added to an organization.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/organizations')}
            >
              Manage Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Select an Organization
          </h1>
          <p className="text-muted-foreground">
            Choose an organization to continue
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{org.name}</CardTitle>
                    <CardDescription className="truncate">{org.slug}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {org.domain && (
                  <p className="text-xs text-muted-foreground mb-4 truncate">
                    {org.domain}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={() => handleSelect(org)}
                  disabled={selecting === org.id}
                >
                  {selecting === org.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    'Select'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

