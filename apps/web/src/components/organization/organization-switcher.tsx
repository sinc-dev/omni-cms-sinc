"use client"

import * as React from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import { ChevronsUpDown, Building2 } from "lucide-react"
import { useOrganization } from "@/lib/context/organization-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function OrganizationSwitcher() {
  const { isMobile } = useSidebar()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentOrgId = params.orgId as string | undefined
  const { organization, setOrganization, organizations, isLoading } = useOrganization()

  const handleOrgChange = (org: { id: string; name: string; slug: string }) => {
    setOrganization(org)
    
    // Update URL to new organization, preserving current route
    if (currentOrgId && pathname) {
      // Replace orgId in current path
      const newPath = pathname.replace(`/${currentOrgId}`, `/${org.id}`)
      router.push(newPath)
    } else {
      // No current org in URL, go to dashboard
      router.push(`/${org.id}/dashboard`)
    }
  }

  if (isLoading || !organization) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Loading...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{organization.name}</span>
                <span className="truncate text-xs">{organization.slug}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgChange(org)}
                className={organization.id === org.id ? "bg-accent" : ""}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.slug}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/select-organization')}>
              <Building2 className="mr-2 h-4 w-4" />
              Switch Organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

