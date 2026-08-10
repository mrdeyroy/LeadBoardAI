import { CalendarClock, LayoutDashboard, Settings, Users } from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/follow-ups', label: 'Follow-ups', icon: CalendarClock },
]

export const SETTINGS_ITEM = { to: '/settings', label: 'Settings', icon: Settings }

export function sectionTitle(pathname) {
  const item = [...NAV_ITEMS, SETTINGS_ITEM].find((n) => n.to === pathname)
  return item?.label ?? ''
}