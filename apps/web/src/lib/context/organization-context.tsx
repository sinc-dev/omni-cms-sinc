'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { ApiError } from '@/lib/api-client/errors';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
}

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  isLoading: boolean;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const STORAGE_KEY = 'omni-cms-current-org-id';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const orgIdFromUrl = params.orgId as string | undefined;
  
  const [organization, setOrganizationState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch organizations once on mount (cached for all components)
  const fetchOrganizations = useCallback(async (force = false) => {
    // Skip if already fetching
    if (isFetchingRef.current && !force) {
      return;
    }

    // Skip if already fetched (unless forced refresh)
    if (hasFetchedRef.current && !force) {
      setIsLoading(false);
      return;
    }

    // Skip if on error pages
    if (pathname === '/unauthorized' || pathname === '/forbidden' || pathname === '/sign-in' || pathname === '/sign-up') {
      setIsLoading(false);
      return;
    }

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    isFetchingRef.current = true;

    try {
      setIsLoading(true);
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
        setOrganizations([]);
      }
    } catch (error) {
      // Don't handle errors if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Silently fail - let individual components handle errors
      // If 401, redirect will be handled by API client
      if (error instanceof ApiError && error.status === 401) {
        // Redirect will happen in API client
        setOrganizations([]);
      } else {
        console.error('Failed to fetch organizations:', error);
        setOrganizations([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [pathname]);

  // Initial fetch on mount
  useEffect(() => {
    fetchOrganizations();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isFetchingRef.current = false;
    };
  }, [fetchOrganizations]);

  // Refresh function that components can call
  const refreshOrganizations = useCallback(async () => {
    hasFetchedRef.current = false;
    await fetchOrganizations(true);
  }, [fetchOrganizations]);

  // Sync organization from URL params
  useEffect(() => {
    if (orgIdFromUrl && organizations.length > 0) {
      const org = organizations.find((o) => o.id === orgIdFromUrl);
      if (org && org.id !== organization?.id) {
        setOrganizationState(org);
        localStorage.setItem(STORAGE_KEY, org.id);
      } else if (!org) {
        // URL has orgId but user doesn't have access - will be handled by layout
        setOrganizationState(null);
      }
    } else if (!orgIdFromUrl && pathname?.startsWith('/select-organization')) {
      // On select-organization page, clear org
      setOrganizationState(null);
    }
  }, [orgIdFromUrl, organizations, organization, pathname]);

  // Load organization from localStorage on mount (fallback)
  useEffect(() => {
    if (!orgIdFromUrl && organizations.length > 0 && !organization) {
      const storedOrgId = localStorage.getItem(STORAGE_KEY);
      if (storedOrgId) {
        const org = organizations.find((o) => o.id === storedOrgId);
        if (org) {
          setOrganizationState(org);
        }
      }
    }
  }, [organizations, orgIdFromUrl, organization]);

  const setOrganization = (org: Organization | null) => {
    setOrganizationState(org);
    if (org) {
      localStorage.setItem(STORAGE_KEY, org.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        setOrganization,
        organizations,
        setOrganizations,
        isLoading,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

