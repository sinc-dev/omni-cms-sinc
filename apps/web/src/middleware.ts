import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/select-organization' ||
    pathname === '/unauthorized' ||
    pathname === '/forbidden' ||
    pathname === '/sign-in' ||
    pathname === '/sign-up' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check if route matches /:orgId/... pattern
  const orgIdMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);
  
  if (orgIdMatch) {
    const firstSegment = orgIdMatch[1];
    
    // If first segment is a known non-org route, allow it
    const nonOrgRoutes = ['organizations', 'select-organization', 'api', '_next', 'favicon'];
    if (nonOrgRoutes.includes(firstSegment)) {
      return NextResponse.next();
    }

    // This looks like an orgId route - validation will happen in layout
    return NextResponse.next();
  }

  // For root path, redirect to select-organization
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/select-organization', request.url));
  }

  // For /admin routes, redirect to select-organization (will be migrated)
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/select-organization', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

