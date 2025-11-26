'use client';

import { Suspense } from 'react';

import { AuthLayout } from '@/components/auth/auth-layout';
import { SignInForm } from '@/components/auth/sign-in-form';

function SignInContent() {
  return (
    <AuthLayout
      title="Sign In"
      description="Sign in to your account to continue"
    >
      <SignInForm />
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    // Suspense boundary is required for components that use useSearchParams/usePathname
    // in statically pre-rendered segments per Next.js guidance.
    <Suspense
      fallback={
        <div className="flex justify-center py-8 text-sm text-muted-foreground">
          Loading sign-in...
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

