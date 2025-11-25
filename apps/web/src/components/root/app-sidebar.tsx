"use client"

import * as React from "react"
import { Layers } from "lucide-react"
import { RootNavMain } from "@/components/root/nav-main"
import { NavUser } from "@/components/navigation/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

function RootSidebarHeader() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className="flex h-16 items-center px-2">
      {isCollapsed ? (
        <div className="flex w-full items-center justify-center">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Layers className="size-4 shrink-0" />
          </div>
        </div>
      ) : (
        <div className="px-4">
          <h1 className="text-xl font-bold">Omni CMS</h1>
        </div>
      )}
    </div>
  )
}

export function RootAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <RootSidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <RootNavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

