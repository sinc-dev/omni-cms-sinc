'use client';

import { usePathname } from 'next/navigation';
import { RootAppSidebar } from '@/components/root/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOrgRoute = pathname?.match(/^\/([^/]+)\//); // Matches /:orgId/... pattern
  const isErrorRoute = pathname === '/error' || pathname === '/forbidden' || pathname === '/unauthorized' || pathname === '/not-found';
  const isSelectOrgRoute = pathname === '/select-organization';
  const isOrganizationsRoute = pathname === '/organizations';
  const isAuthRoute = pathname === '/sign-in' || pathname === '/sign-up';

  // For org routes, select-organization, organizations, error routes, and auth routes, don't show root sidebar/header
  // These layouts will handle their own UI
  if (isOrgRoute || isErrorRoute || isSelectOrgRoute || isOrganizationsRoute || isAuthRoute) {
    return <>{children}</>;
  }

  // For non-admin routes, show root sidebar with shadcn sidebar
  return (
    <SidebarProvider>
      <RootAppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 lg:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                SyncUni
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Omni CMS
              </span>
            </div>
            {/* Placeholder for user menu or environment switcher */}
            <div className="h-8 w-8 rounded-full bg-muted" />
          </div>
        </header>
        <main className="flex-1 bg-muted/40 px-4 pb-8 pt-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

