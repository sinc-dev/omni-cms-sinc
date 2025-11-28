import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

import { OrgSearchPageClient } from './search-page-client';

export default function SearchPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Search</h1>
            <p className="text-muted-foreground">Loading search...</p>
          </div>
        </div>
      }
    >
      <OrgSearchPageClient />
    </Suspense>
  );
}

