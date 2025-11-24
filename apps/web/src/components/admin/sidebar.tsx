'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Image,
    Tags,
    Users,
    User,
    Settings,
    FolderTree,
    Layers,
    Webhook,
    BarChart3,
    Blocks,
    FileText as FileTemplate,
    CheckCircle2,
    Key,
    Database,
    Network,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Posts', href: '/admin/posts', icon: FileText },
    { name: 'Media', href: '/admin/media', icon: Image },
    { name: 'Taxonomies', href: '/admin/taxonomies', icon: Tags },
    { name: 'Post Types', href: '/admin/post-types', icon: FolderTree },
    { name: 'Custom Fields', href: '/admin/custom-fields', icon: Layers },
    { name: 'Data Models', href: '/models', icon: Database },
    { name: 'Relationships', href: '/admin/relationships', icon: Network },
    { name: 'Content Blocks', href: '/admin/content-blocks', icon: Blocks },
    { name: 'Templates', href: '/admin/templates', icon: FileTemplate },
    { name: 'Reviews', href: '/admin/reviews', icon: CheckCircle2 },
    { name: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'API Keys', href: '/admin/api-keys', icon: Key },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Profile', href: '/admin/profile', icon: User },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden w-64 border-r bg-card md:block">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b px-6">
                    <h1 className="text-xl font-bold">Omni CMS</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4" role="navigation" aria-label="Main navigation">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <item.icon className="h-5 w-5" aria-hidden="true" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t p-4">
                    <p className="text-xs text-muted-foreground">
                        © 2025 Omni CMS
                    </p>
                </div>
            </div>
        </div>
    );
}
