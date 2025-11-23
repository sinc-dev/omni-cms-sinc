import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const breadcrumbSeparator = (
  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
);

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm', className)}
    >
      <Link
        href="/admin"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      {items.length > 0 && breadcrumbSeparator}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <span
              key={index}
              className="font-medium text-foreground"
              aria-current="page"
            >
              {item.label}
            </span>
          );
        }

        if (item.href) {
          return (
            <React.Fragment key={index}>
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
              {breadcrumbSeparator}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={index}>
            <span className="text-muted-foreground">{item.label}</span>
            {breadcrumbSeparator}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/**
 * Hook to generate breadcrumb items from pathname
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname) return [];

  const pathSegments = pathname.split('/').filter(Boolean);

  // Skip 'admin' segment if present
  if (pathSegments[0] === 'admin') {
    pathSegments.shift();
  }

  if (pathSegments.length === 0) {
    return []; // At dashboard, no breadcrumbs needed
  }

  const items: BreadcrumbItem[] = [];
  let currentPath = '/admin';

  pathSegments.forEach((segment, index) => {
    const isLast = index === pathSegments.length - 1;
    currentPath += `/${segment}`;

    // Humanize segment names
    const label = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    items.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return items;
}

