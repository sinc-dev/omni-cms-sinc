'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mail, ArrowLeft, Info } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { getRedirectUrl, storeRedirectUrl } from '@/lib/auth/cloudflare-access-client';

type Step = 'email' | 'otp';

export function OTPSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      await apiClient.requestOTP(normalizedEmail);
      setEmail(normalizedEmail);
      setStep('otp');
      setResendCooldown(60); // 60 second cooldown
      setShowSuccessMessage(true);
      // Clear success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Start countdown
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiClient.verifyOTP(email, otp);
      
      // Store session token
      if (typeof window !== 'undefined' && response.data.token) {
        localStorage.setItem('omni-cms:session-token', response.data.token);
      }

      // Get redirect URL and navigate
      const redirectUrl = getRedirectUrl(searchParams);
      storeRedirectUrl(redirectUrl);
      
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired code. Please try again.';
      setError(errorMessage);
      // Don't clear OTP on error - let user see what they entered and fix it
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setError(null);
    setLoading(true);

    try {
      await apiClient.requestOTP(email);
      setResendCooldown(60);
      
      // Start countdown
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string) => {
    // Only accept numeric digits
    const numericValue = value.replace(/\D/g, '');
    setOtp(numericValue);
    setError(null);
    
    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      handleOTPSubmit();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const numericValue = pastedText.replace(/\D/g, '').slice(0, 6);
    if (numericValue.length === 6) {
      setOtp(numericValue);
      setError(null);
      // Auto-submit after paste
      setTimeout(() => {
        handleOTPSubmit();
      }, 100);
    } else {
      setOtp(numericValue);
    }
  };

  // Focus OTP input when step changes to 'otp'
  useEffect(() => {
    if (step === 'otp') {
      // Small delay to ensure input is rendered
      setTimeout(() => {
        const firstInput = document.querySelector('[data-slot="input-otp"] input') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [step]);

  if (step === 'email') {
    return (
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            disabled={loading}
            required
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send code
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOTPSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="otp">Enter verification code</Label>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {showSuccessMessage && (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Code sent! Check your email.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="flex justify-center" onPaste={handlePaste}>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={handleOTPChange}
              disabled={loading}
              containerClassName="gap-2 sm:gap-3"
            >
              <InputOTPGroup>
                <InputOTPSlot 
                  index={0} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
                <InputOTPSlot 
                  index={1} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
                <InputOTPSlot 
                  index={2} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
                <InputOTPSlot 
                  index={3} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
                <InputOTPSlot 
                  index={4} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
                <InputOTPSlot 
                  index={5} 
                  className="h-12 w-12 sm:h-14 sm:w-14 text-lg sm:text-xl font-semibold" 
                />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            Tip: You can paste the 6-digit code here
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify code'
          )}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setOtp('');
              setError(null);
            }}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            disabled={loading}
          >
            <ArrowLeft className="h-3 w-3" />
            Change email
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </form>
  );
}

