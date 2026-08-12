import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { api } from '@/lib/api'
import { applyTheme } from '@/lib/theme'
import { AppSidebar } from './AppSidebar'
import { TopBar } from './TopBar'

function AnimatedOutlet() {
  const location = useLocation()
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <Outlet />
    </motion.div>
  )
}

export function AppShell() {
  useEffect(() => {
    applyTheme()
    api('/user/profile')
      .then((data) => {
        if (data?.user?.preferences?.theme) {
          applyTheme(data.user.preferences.theme)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-muted/40">
          <div className="mx-auto w-full max-w-6xl p-6">
            <AnimatedOutlet />
          </div>
        </main>
      </SidebarInset>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}