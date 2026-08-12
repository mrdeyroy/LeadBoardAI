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

  const renderNavItem = ({ to, label, icon: Icon }) => {
    const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
    return (
      <SidebarMenuItem key={to}>
        <SidebarMenuButton asChild isActive={active} className={active ? "bg-foreground text-background font-semibold hover:bg-foreground hover:text-background rounded-full transition-all" : "rounded-full transition-all hover:bg-muted"}>
          <NavLink to={to} end={to === '/dashboard'}>
            <Icon className="size-4" />
            <span className="text-xs font-medium tracking-tight">{label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar className="border-r border-border/80">
      <SidebarHeader className="pt-4 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="gap-2.5 rounded-full hover:bg-muted px-3" asChild>
              <NavLink to="/">
                <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-background font-bold">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-xs tracking-tight">LeadBoard AI</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Agency CRM</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-3 mb-1">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">{NAV_ITEMS.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>{renderNavItem(SETTINGS_ITEM)}</SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }