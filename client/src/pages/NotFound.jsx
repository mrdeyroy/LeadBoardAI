import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-muted/40 p-6 text-center">
      <p className="text-5xl font-semibold tracking-tight">404</p>
      <p className="text-muted-foreground">This page doesn't exist.</p>
      <Button asChild className="mt-2">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  )
}