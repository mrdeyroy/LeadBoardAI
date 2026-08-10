import { Navigate } from 'react-router-dom'

import { Loader2 } from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { user, initializing } = useAuth()
  if (initializing) return <FullPageLoader label="Checking your session…" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function GuestOnly({ children }) {
  const { user, initializing } = useAuth()
  if (initializing) return <FullPageLoader label="Loading…" />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}