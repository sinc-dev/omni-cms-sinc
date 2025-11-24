'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  const [organization, setOrganizationState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load organization from localStorage on mount
  useEffect(() => {
    const storedOrgId = localStorage.getItem(STORAGE_KEY);
    if (storedOrgId && organizations.length > 0) {
      const org = organizations.find((o) => o.id === storedOrgId);
      if (org) {
        setOrganizationState(org);
      }
    }
    setIsLoading(false);
  }, [organizations]);

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

