"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Blocks,
  Settings,
} from "lucide-react"

import { OrganizationSwitcher } from "@/components/organization/organization-switcher"
import { NavMain } from "@/components/navigation/nav-main"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation items - URLs will be dynamically generated with orgId
// This component will be used within [orgId] layout, so orgId is available
const getNavMainItems = (orgId: string) => [
  {
    title: "Dashboard",
    url: `/${orgId}/dashboard`,
    icon: LayoutDashboard,
    isActive: false,
  },
  {
    title: "Content",
    url: "#",
    icon: FileText,
    items: [
      { title: "Posts", url: `/${orgId}/posts` },
      { title: "Media", url: `/${orgId}/media` },
      { title: "Taxonomies", url: `/${orgId}/taxonomies` },
    ],
  },
  {
    title: "Structure",
    url: "#",
    icon: FolderTree,
    items: [
      { title: "Post Types", url: `/${orgId}/post-types` },
      { title: "Custom Fields", url: `/${orgId}/custom-fields` },
      { title: "Data Models", url: `/${orgId}/models` },
      { title: "Relationships", url: `/${orgId}/relationships` },
    ],
  },
  {
    title: "Components",
    url: "#",
    icon: Blocks,
    items: [
      { title: "Content Blocks", url: `/${orgId}/content-blocks` },
      { title: "Templates", url: `/${orgId}/templates` },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    items: [
      { title: "Webhooks", url: `/${orgId}/webhooks` },
      { title: "Analytics", url: `/${orgId}/analytics` },
      { title: "API Keys", url: `/${orgId}/api-keys` },
      { title: "Users", url: `/${orgId}/users` },
      { title: "Settings", url: `/${orgId}/settings` },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const orgId = params.orgId as string | undefined;
  
  // If no orgId, return empty sidebar (shouldn't happen in [orgId] layout)
  if (!orgId) {
    return null;
  }
  
  const navMainItems = getNavMainItems(orgId);
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

