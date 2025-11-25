'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, usePathname } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  setOrganization: (org: Organization | null) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
  isLoading: boolean;
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
    if (!orgIdFromUrl && organizations.length > 0) {
      const storedOrgId = localStorage.getItem(STORAGE_KEY);
      if (storedOrgId) {
        const org = organizations.find((o) => o.id === storedOrgId);
        if (org) {
          setTimeout(() => {
            setOrganizationState(org);
          }, 0);
        }
      }
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 0);
  }, [organizations, orgIdFromUrl]);

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

