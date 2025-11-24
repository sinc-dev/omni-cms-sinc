'use client';

import { usePathname } from 'next/navigation';
import { Breadcrumb, useBreadcrumbs } from '@/components/ui/breadcrumb';

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const items = useBreadcrumbs(pathname || '');

  // Don't show breadcrumbs on dashboard (empty items)
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <Breadcrumb items={items} />
    </div>
  );
}

