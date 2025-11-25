'use client';

import { useParams } from 'next/navigation';

/**
 * Hook to generate organization-scoped URLs
 * Automatically prepends the current orgId to the path
 */
export function useOrgUrl() {
  const params = useParams();
  const orgId = params.orgId as string | undefined;

  const getUrl = (path: string): string => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    if (!orgId) {
      // If no orgId, return path as-is (might be on select-organization or organizations page)
      return `/${cleanPath}`;
    }
    
    return `/${orgId}/${cleanPath}`;
  };

  return { getUrl, orgId };
}

