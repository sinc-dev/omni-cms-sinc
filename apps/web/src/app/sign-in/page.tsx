'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { SignInForm } from '@/components/auth/sign-in-form';

export default function SignInPage() {
  return (
    <AuthLayout
      title="Sign In"
      description="Sign in to your account to continue"
    >
      <SignInForm />
    </AuthLayout>
  );
}

