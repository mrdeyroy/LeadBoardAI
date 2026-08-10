import { useUser } from '@clerk/clerk-react'
import { formatDate } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export default function Settings() {
  const { user } = useUser()

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User'
  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            The name and email shown across your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{displayName}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{email}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Member since</span>
            <span className="text-sm">{formatDate(user?.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 py-5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Managed by your sign-in provider</p>
            <p className="text-sm text-muted-foreground">
              Profile and security settings — avatar, password, two-factor — are managed through
              Clerk, your sign-in provider.
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled>
            Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}