import { NavLink, useLocation } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NAV_ITEMS, SETTINGS_ITEM } from './nav'

function AppSidebar() {
  const { pathname } = useLocation()

  const renderNavItem = ({ to, label, icon: Icon }) => (
    <SidebarMenuItem key={to}>
      <SidebarMenuButton asChild isActive={pathname === to}>
        <NavLink to={to} end={to === '/dashboard'}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2" asChild>
              <NavLink to="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold">LeadBoard AI</span>
                  <span className="text-xs text-muted-foreground">Lightweight CRM</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{NAV_ITEMS.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>{renderNavItem(SETTINGS_ITEM)}</SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }