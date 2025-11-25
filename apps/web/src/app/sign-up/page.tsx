'use client';

import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/auth-layout';
import { ProviderButton } from '@/components/auth/provider-button';
import { getCloudflareAccessLoginUrl, getRedirectUrl, storeRedirectUrl } from '@/lib/auth/cloudflare-access-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>('/select-organization');

  useEffect(() => {
    const redirect = getRedirectUrl(searchParams);
    setRedirectUrl(redirect);
    storeRedirectUrl(redirect);
  }, [searchParams]);

  const handleProviderClick = (provider: 'google' | 'github' | 'email' | 'microsoft' | 'okta') => {
    try {
      setError(null);
      const loginUrl = getCloudflareAccessLoginUrl(redirectUrl);
      window.location.href = loginUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate sign-up. Please try again.');
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      description="Sign up to get started"
    >
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cloudflare Access may require an invitation from your administrator. If you don't have access, please contact your administrator.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <ProviderButton
            provider="google"
            onClick={() => handleProviderClick('google')}
          />
          <ProviderButton
            provider="github"
            onClick={() => handleProviderClick('github')}
          />
          <ProviderButton
            provider="email"
            onClick={() => handleProviderClick('email')}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={`/sign-in${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

