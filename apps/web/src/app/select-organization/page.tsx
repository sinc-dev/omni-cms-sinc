'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, HelpCircle, LogOut, Users, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { useOrganization } from '@/lib/context/organization-context';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
}

export default function SelectOrganizationPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { handleError } = useErrorHandler();
  const { organizations: cachedOrgs, isLoading: orgsLoading } = useOrganization();
  const isRedirectingRef = useRef(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRedirectingToOrg, setIsRedirectingToOrg] = useState(false);
  const hasCheckedAutoRedirectRef = useRef(false);
  
  // Get last used organization from localStorage
  const getLastUsedOrgId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('omni-cms:last-used-org-id');
  };

  // Fetch user profile to check if super admin (for empty state)
  const profileFetchedRef = useRef(false);
  const isFetchingProfileRef = useRef(false);
  const profileAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Guard: Prevent multiple simultaneous requests
    if (isFetchingProfileRef.current) return;
    
    // Guard: Early return if already fetched
    if (profileFetchedRef.current) return;

    isFetchingProfileRef.current = true;
    profileAbortControllerRef.current = new AbortController();

    const fetchProfile = async () => {
      try {
        const profileResponse = await apiClient.getCurrentUser() as {
          success: boolean;
          data: UserProfile;
        };
        
        if (profileAbortControllerRef.current?.signal.aborted) return;
        
        if (profileResponse.success && profileResponse.data) {
          setUserProfile(profileResponse.data);
          profileFetchedRef.current = true;
        }
      } catch (error) {
        if (profileAbortControllerRef.current?.signal.aborted) return;
        // Silently fail - profile is optional
        console.error('Failed to load profile:', error);
      } finally {
        isFetchingProfileRef.current = false;
      }
    };

    fetchProfile();

    // Cleanup: Abort request on unmount
    return () => {
      profileAbortControllerRef.current?.abort();
      isFetchingProfileRef.current = false;
    };
  }, []); // Empty deps - only fetch once on mount

  // Auto-redirect if single organization (using cached organizations from context)
  useEffect(() => {
    // Skip if already checked or loading or redirecting
    if (hasCheckedAutoRedirectRef.current || orgsLoading || isRedirectingRef.current) {
      return;
    }

    // Skip if on error pages
    if (pathname === '/unauthorized' || pathname === '/forbidden') {
      return;
    }

    // Check sessionStorage for redirect flag
    if (typeof window !== 'undefined' && sessionStorage.getItem('omni-cms:redirecting') === 'true') {
      return;
    }

    // Auto-redirect if single organization
    if (cachedOrgs.length === 1 && !isRedirectingRef.current) {
      hasCheckedAutoRedirectRef.current = true;
      isRedirectingRef.current = true;
      // Brief delay to show redirecting message, set state in setTimeout to avoid synchronous setState
      setTimeout(() => {
        setIsRedirectingToOrg(true);
        router.push(`/${cachedOrgs[0].id}/dashboard`);
      }, 800);
    }
  }, [cachedOrgs, orgsLoading, pathname, router]);

  const handleSelect = async (org: Organization) => {
    try {
      setSelecting(org.id);
      
      // Store as last used organization
      if (typeof window !== 'undefined') {
        localStorage.setItem('omni-cms:last-used-org-id', org.id);
      }
      
      // Redirect to dashboard for the selected organization
      router.push(`/${org.id}/dashboard`);
    } catch (error) {
      handleError(error, { title: 'Failed to Select Organization' });
      setSelecting(null);
    }
  };

  // Show redirecting message for single organization
  if (isRedirectingToOrg && cachedOrgs.length === 1) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Redirecting...</CardTitle>
            <CardDescription>
              Taking you to {cachedOrgs[0]?.name || 'your organization'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orgsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  // Improved empty state with helpful guidance
  if (cachedOrgs.length === 0) {
    const isSuperAdmin = userProfile?.isSuperAdmin ?? false;

    return (
      <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-amber-500/10 p-3">
                <Building2 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">No Organizations Found</CardTitle>
            <CardDescription>
              Your account has been created, but you don&apos;t have access to any organizations yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Contact your administrator to get invited to an organization</li>
                  <li>Check your email for an invitation link</li>
                  <li>Wait for an organization admin to add you</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {isSuperAdmin && (
                <Button
                  className="w-full"
                  onClick={() => router.push('/organizations')}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Organizations
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // Clear session and redirect to sign-in
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('omni-cms:session-token');
                    sessionStorage.clear();
                  }
                  router.push('/sign-in');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Need help? Contact your administrator or check your email for invitation details.
              </p>
            </div>
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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {cachedOrgs.map((org) => {
            const isLastUsed = getLastUsedOrgId() === org.id;
            const isSelecting = selecting === org.id;
            
            return (
              <Card
                key={org.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                  isLastUsed ? 'border-primary/30 shadow-sm' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      isLastUsed ? 'bg-primary/20' : 'bg-primary/10'
                    }`}>
                      <Building2 className={`h-6 w-6 ${
                        isLastUsed ? 'text-primary' : 'text-primary/80'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg font-semibold truncate">
                          {org.name}
                        </CardTitle>
                        {isLastUsed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary shrink-0">
                            <Clock className="h-3 w-3" />
                            Last used
                          </span>
                        )}
                      </div>
                      <CardDescription className="truncate text-sm">
                        {org.slug}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {org.domain && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{org.domain}</span>
                    </div>
                  )}
                  
                  {/* Placeholder for member count - can be enhanced when API provides this */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>Members</span>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    onClick={() => handleSelect(org)}
                    disabled={isSelecting}
                    size="lg"
                  >
                    {isSelecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Selecting...
                      </>
                    ) : (
                      <>
                        {isLastUsed && <CheckCircle2 className="mr-2 h-4 w-4" />}
                        {isLastUsed ? 'Continue' : 'Select'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

