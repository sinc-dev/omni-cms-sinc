'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  Building2,
  LayoutDashboard,
  FileText,
  Image,
  Tags,
  FolderTree,
  Layers,
  Blocks,
  Users,
  Webhook,
  BarChart3,
  Key,
} from 'lucide-react';
import Link from 'next/link';
import { useOrganization } from '@/lib/context/organization-context';
import { apiClient } from '@/lib/api-client';
import { useErrorHandler } from '@/lib/hooks/use-error-handler';
import { MobileMenu } from '@/components/navigation/mobile-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationsResponse {
  success: boolean;
  data: Organization[];
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Generate flat navigation items for mobile menu
const getMobileNavItems = (orgId: string) => [
  { name: 'Dashboard', href: `/${orgId}/dashboard`, icon: LayoutDashboard },
  { name: 'Posts', href: `/${orgId}/posts`, icon: FileText },
  { name: 'Media', href: `/${orgId}/media`, icon: Image },
  { name: 'Taxonomies', href: `/${orgId}/taxonomies`, icon: Tags },
  { name: 'Post Types', href: `/${orgId}/post-types`, icon: FolderTree },
  { name: 'Custom Fields', href: `/${orgId}/custom-fields`, icon: Layers },
  { name: 'Content Blocks', href: `/${orgId}/content-blocks`, icon: Blocks },
  { name: 'Templates', href: `/${orgId}/templates`, icon: Blocks },
  { name: 'Webhooks', href: `/${orgId}/webhooks`, icon: Webhook },
  { name: 'Analytics', href: `/${orgId}/analytics`, icon: BarChart3 },
  { name: 'API Keys', href: `/${orgId}/api-keys`, icon: Key },
  { name: 'Users', href: `/${orgId}/users`, icon: Users },
  { name: 'Settings', href: `/${orgId}/settings`, icon: Settings },
];

export function Header() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentOrgId = params.orgId as string | undefined;
  
  const { organization, setOrganization, organizations, setOrganizations, isLoading: orgLoading } = useOrganization();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  
  const mobileNavItems = currentOrgId ? getMobileNavItems(currentOrgId) : [];

  // Load organizations on mount
  useEffect(() => {
    if (organizations.length === 0 && !orgLoading && !fetchingRef.current) {
      fetchingRef.current = true;
      
      const fetchOrganizations = async () => {
        // Defer setState to avoid cascading renders
        queueMicrotask(() => {
          setLoading(true);
        });
        
        try {
          const response = await apiClient.getOrganizations();
          const orgsResponse = response as OrganizationsResponse;
          if (orgsResponse.success && orgsResponse.data) {
            const orgs = orgsResponse.data;
            setOrganizations(orgs);

            // If no organization is selected but we have organizations, select the first one
            if (!organization && orgs.length > 0) {
              setOrganization(orgs[0]);
            }
          }
        } catch (err) {
          handleError(err, { title: 'Failed to Load Organizations' });
        } finally {
          setLoading(false);
          fetchingRef.current = false;
        }
      };
      
      fetchOrganizations();
    }
  }, [organizations.length, organization, orgLoading, setOrganizations, setOrganization]);

  const handleOrgChange = (org: Organization) => {
    setOrganization(org);
    
    // Update URL to new organization, preserving current route
    if (currentOrgId && pathname) {
      // Replace orgId in current path
      const newPath = pathname.replace(`/${currentOrgId}`, `/${org.id}`);
      router.push(newPath);
    } else {
      // No current org in URL, go to dashboard
      router.push(`/${org.id}/dashboard`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4 md:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12" role="banner">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        {/* Mobile Menu */}
        <MobileMenu navigation={mobileNavItems} />
        
        {/* Organization Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              disabled={loading || organizations.length === 0}
              aria-label="Select organization"
              aria-haspopup="true"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              <span className="font-medium hidden sm:inline">
                {organization?.name || (loading ? 'Loading...' : 'No organization')}
              </span>
              <span className="font-medium sm:hidden">
                {organization?.name?.substring(0, 10) || (loading ? 'Loading...' : 'No org')}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          {organizations.length > 0 && (
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleOrgChange(org)}
                  className={organization?.id === org.id ? 'bg-accent' : ''}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-muted-foreground">{org.slug}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full"
              aria-label="User account menu"
              aria-haspopup="true"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={currentOrgId ? `/${currentOrgId}/profile` : '/select-organization'}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            {currentOrgId && (
              <DropdownMenuItem asChild>
                <Link href={`/${currentOrgId}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link href="/select-organization">
                <Building2 className="mr-2 h-4 w-4" />
                Switch Organization
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

