import { redirect } from 'next/navigation';

// Force dynamic rendering to prevent static generation
// This page needs to redirect based on authentication state
export const dynamic = 'force-dynamic';

/**
 * Root page - redirects to select-organization
 * The select-organization page handles smart routing based on:
 * - Number of organizations (auto-redirect to dashboard if single org)
 * - Authentication state
 * 
 * The middleware also redirects / to /select-organization as a fallback,
 * but this server component ensures proper dynamic rendering.
 */
export default function Home() {
  // Redirect to select-organization page which handles all routing logic
  redirect('/select-organization');
}
