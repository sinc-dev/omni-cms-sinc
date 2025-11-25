import { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/breadcrumbs/breadcrumbs';
import { OrganizationProvider } from '@/lib/context/organization-context';
import { SchemaProvider } from '@/lib/context/schema-context';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary>
            <OrganizationProvider>
                <SchemaProvider>
                    <ToastProvider>
                        <SidebarProvider>
                            <AppSidebar />
                            <SidebarInset>
                                <Header />
                                <main className="flex-1 overflow-y-auto p-4 md:p-6" role="main">
                                    <Breadcrumbs />
                                    {children}
                                </main>
                            </SidebarInset>
                        </SidebarProvider>
                    </ToastProvider>
                </SchemaProvider>
            </OrganizationProvider>
        </ErrorBoundary>
    );
}
