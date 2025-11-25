'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type LucideIcon, Menu } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface NavigationItem {
    name: string;
    href: string;
    icon?: LucideIcon;
}

interface MobileMenuProps {
    navigation?: NavigationItem[];
    title?: string;
}

export function MobileMenu({ 
    navigation = [],
    title = 'Omni CMS'
}: MobileMenuProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // If no navigation items provided, return empty menu
    if (navigation.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xs p-0" aria-label="Navigation menu">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                </DialogHeader>
                <nav className="flex flex-col p-4" role="navigation" aria-label="Main navigation">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {item.icon && <item.icon className="h-5 w-5" aria-hidden="true" />}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t p-4">
                    <p className="text-xs text-muted-foreground">
                        © 2025 Omni CMS
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

