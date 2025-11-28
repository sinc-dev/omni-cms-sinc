'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProviderButton } from './provider-button';
import { OTPSignIn } from './otp-sign-in';
import { getCloudflareAccessLoginUrlWithCleanup, getRedirectUrl, storeRedirectUrl } from '@/lib/auth/cloudflare-access-client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

type AuthMethod = 'providers' | 'otp';

export function SignInForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string>('/select-organization');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('providers');

  useEffect(() => {
    // Get redirect URL from query params
    const redirect = getRedirectUrl(searchParams);
    setRedirectUrl(redirect);
    storeRedirectUrl(redirect);
  }, [searchParams]);

  const handleProviderClick = (provider: 'google' | 'github' | 'email' | 'microsoft' | 'okta') => {
    try {
      setError(null);
      
      // Use cleanup function to clear OTP tokens when using Cloudflare Access
      const loginUrl = getCloudflareAccessLoginUrlWithCleanup(redirectUrl);
      
      // Redirect to Cloudflare Access
      window.location.href = loginUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate sign-in. Please try again.');
    }
  };

  if (authMethod === 'otp') {
    return (
      <div className="space-y-4">
        <OTPSignIn />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setAuthMethod('providers')}
            className="text-sm text-primary hover:underline"
          >
            Use another sign-in method
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <div className="text-center">
        <button
          type="button"
          onClick={() => setAuthMethod('otp')}
          className="text-sm text-primary hover:underline"
        >
          Continue with One-Time Code
        </button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href={`/sign-up${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

