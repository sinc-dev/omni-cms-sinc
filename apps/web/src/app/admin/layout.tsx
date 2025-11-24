import { ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { Header } from '@/components/admin/header';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { OrganizationProvider } from '@/lib/context/organization-context';
import { ToastProvider } from '@/components/ui/toast';
import { ErrorBoundary } from '@/components/error-boundary';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary>
            <OrganizationProvider>
                <ToastProvider>
                    <div className="flex h-screen overflow-hidden bg-background">
                        {/* Sidebar */}
                        <Sidebar />

                        {/* Main Content */}
                        <div className="flex flex-1 flex-col overflow-hidden">
                            <Header />
                            <main className="flex-1 overflow-y-auto p-4 md:p-6" role="main">
                                <AdminBreadcrumbs />
                                {children}
                            </main>
                        </div>
                    </div>
                </ToastProvider>
            </OrganizationProvider>
        </ErrorBoundary>
    );
}
