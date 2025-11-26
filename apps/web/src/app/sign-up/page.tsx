import { Suspense } from 'react';

import { SignUpPageClient } from './sign-up-page-client';

export default function SignUpPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="flex justify-center py-8 text-sm text-muted-foreground">
          Loading sign-up...
        </div>
      }
    >
      <SignUpPageClient />
    </Suspense>
  );
}

