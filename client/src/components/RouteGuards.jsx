import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <FullPageLoader label="Checking your session…" />
  if (!isSignedIn) return <Navigate to="/login" replace />
  return children
}

export function GuestOnly({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) return <FullPageLoader label="Loading…" />
  if (isSignedIn) return <Navigate to="/dashboard" replace />
  return children
}