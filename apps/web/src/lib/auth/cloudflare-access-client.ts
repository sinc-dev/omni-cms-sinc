/**
 * Client-side utilities for Cloudflare Access authentication
 */

/**
 * Gets the Cloudflare Access login URL with redirect
 * @param redirectUrl - The URL to redirect to after authentication
 * @returns The Cloudflare Access login URL
 */
export function getCloudflareAccessLoginUrl(redirectUrl: string): string {
  const teamDomain = process.env.NEXT_PUBLIC_CF_ACCESS_TEAM_DOMAIN;
  
  if (!teamDomain) {
    throw new Error('NEXT_PUBLIC_CF_ACCESS_TEAM_DOMAIN is not configured');
  }

  // Ensure we have a full URL for the redirect
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  let fullRedirectUrl: string;
  
  try {
    // If it's already a full URL, use it; otherwise construct one
    const url = new URL(redirectUrl, appUrl);
    
    // Only allow redirects to the same origin
    if (url.origin !== new URL(appUrl).origin) {
      throw new Error('Invalid redirect URL');
    }
    
    fullRedirectUrl = url.toString();
  } catch {
    // If URL construction fails, use the app URL with the path
    fullRedirectUrl = new URL(redirectUrl, appUrl).toString();
  }

  // Construct Cloudflare Access login URL with full URL
  const encodedRedirect = encodeURIComponent(fullRedirectUrl);
  return `https://${teamDomain}/cdn-cgi/access/login?redirect_url=${encodedRedirect}`;
}

/**
 * Gets the redirect URL from query parameters or returns default
 * @param searchParams - URL search parameters
 * @param defaultPath - Default path to redirect to if no redirect param
 * @returns The redirect URL
 */
export function getRedirectUrl(searchParams: URLSearchParams, defaultPath: string = '/select-organization'): string {
  const redirect = searchParams.get('redirect');
  
  if (!redirect) {
    return defaultPath;
  }

  // Validate redirect URL
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const url = new URL(redirect, appUrl);
    
    // Only allow redirects to the same origin
    if (url.origin !== new URL(appUrl).origin) {
      return defaultPath;
    }

    return redirect;
  } catch {
    return defaultPath;
  }
}

/**
 * Stores the redirect URL in sessionStorage
 * @param url - The URL to store
 */
export function storeRedirectUrl(url: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('omni-cms:redirect-url', url);
  }
}

/**
 * Gets the stored redirect URL from sessionStorage
 * @param defaultPath - Default path if no stored URL
 * @returns The redirect URL
 */
export function getStoredRedirectUrl(defaultPath: string = '/select-organization'): string {
  if (typeof window === 'undefined') {
    return defaultPath;
  }

  const stored = sessionStorage.getItem('omni-cms:redirect-url');
  if (!stored) {
    return defaultPath;
  }

  // Validate stored URL
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = new URL(stored, appUrl);
    
    if (url.origin !== new URL(appUrl).origin) {
      return defaultPath;
    }

    return stored;
  } catch {
    return defaultPath;
  }
}

/**
 * Clears the stored redirect URL
 */
export function clearStoredRedirectUrl(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('omni-cms:redirect-url');
  }
}

