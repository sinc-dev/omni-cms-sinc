/**
 * Hook to generate breadcrumb items from a pathname
 * Maps admin routes to readable labels
 */

export interface BreadcrumbItem {
  label: string;
  href: string;
}

// Route label mappings (without orgId prefix)
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'posts': 'Posts',
  'media': 'Media',
  'taxonomies': 'Taxonomies',
  'post-types': 'Post Types',
  'custom-fields': 'Custom Fields',
  'models': 'Data Models',
  'relationships': 'Relationships',
  'content-blocks': 'Content Blocks',
  'templates': 'Templates',
  'reviews': 'Reviews',
  'webhooks': 'Webhooks',
  'analytics': 'Analytics',
  'api-keys': 'API Keys',
  'users': 'Users',
  'settings': 'Settings',
  'profile': 'Profile',
  'organizations': 'Organizations',
  'search': 'Search',
};

/**
 * Generates breadcrumb items from a pathname
 * @param pathname - The current pathname (e.g., '/orgId/posts/123')
 * @returns Array of breadcrumb items
 */
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname || pathname === '/') {
    return [];
  }

  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];

  // Check if this is an org route (/:orgId/...)
  const orgIdMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (orgIdMatch) {
    const firstSegment = orgIdMatch[1];
    const orgId = firstSegment;
    
    // Skip known non-org routes
    const nonOrgRoutes = ['organizations', 'select-organization', 'api', '_next', 'favicon'];
    if (nonOrgRoutes.includes(firstSegment)) {
      return [];
    }

    // This is an org route - build breadcrumbs
    // Start with Dashboard
    items.push({ label: 'Dashboard', href: `/${orgId}/dashboard` });

    // Build breadcrumbs from remaining segments (skip orgId)
    let currentPath = `/${orgId}`;
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Skip orgId segment
      if (i === 0) {
        continue;
      }

      // Get label from mapping or generate from segment
      const label = routeLabels[segment] || 
                    segment
                      .split('-')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ');

      items.push({
        label,
        href: currentPath,
      });
    }
  } else {
    // Legacy /admin route handling (for backwards compatibility during migration)
    if (pathname.startsWith('/admin')) {
      items.push({ label: 'Dashboard', href: '/admin' });
      
      let currentPath = '';
      for (let i = 0; i < segments.length; i++) {
        currentPath += `/${segments[i]}`;
        
        if (currentPath === '/admin') {
          continue;
        }

        const label = routeLabels[segments[i]] || 
                      segments[i]
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');

        items.push({
          label,
          href: currentPath,
        });
      }
    }
  }

  return items;
}

