import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-react'
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Save,
  Shield,
  Sliders,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { user: clerkUser } = useUser()
  const clerk = useClerk()
  const [activeTab, setActiveTab] = useState('profile')

  const profileQuery = useAsync(() => api('/user/profile'), [])

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    jobTitle: '',
    companyName: '',
    bio: '',
  })
  const [prefForm, setPrefForm] = useState({
    itemsPerPage: '20',
    defaultView: 'table',
    theme: 'system',
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPref, setSavingPref] = useState(false)

  const dbUser = profileQuery.data?.user

  useEffect(() => {
    if (dbUser) {
      setProfileForm({
        name: dbUser.name || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || '',
        phone: dbUser.phone || '',
        jobTitle: dbUser.jobTitle || '',
        companyName: dbUser.companyName || '',
        bio: dbUser.bio || '',
      })
      if (dbUser.preferences) {
        setPrefForm({
          itemsPerPage: String(dbUser.preferences.itemsPerPage || 20),
          defaultView: dbUser.preferences.defaultView || 'table',
          theme: dbUser.preferences.theme || 'system',
        })
      }
    }
  }, [dbUser, clerkUser])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api('/user/profile', {
        method: 'PATCH',
        body: profileForm,
      })
      toast.success('Profile updated successfully')
      profileQuery.reload()
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePreferences = async (e) => {
    e.preventDefault()
    setSavingPref(true)
    try {
      await api('/user/preferences', {
        method: 'PATCH',
        body: {
          itemsPerPage: Number(prefForm.itemsPerPage),
          defaultView: prefForm.defaultView,
          theme: prefForm.theme,
        },
      })
      toast.success('Preferences saved')
      profileQuery.reload()
    } catch (err) {
      toast.error(err.message || 'Failed to update preferences')
    } finally {
      setSavingPref(false)
    }
  }

  const openClerkProfile = () => {
    if (clerk?.openUserProfile) {
      clerk.openUserProfile()
    } else {
      toast.info('Account settings managed via Clerk session.')
    }
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? dbUser?.email ?? ''

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Account & Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace profile, account security, and CRM preferences.</p>
      </div>

      <div className="flex items-center gap-2 border-b pb-2">
        {[
          { id: 'profile', label: 'Profile Details', icon: UserIcon },
          { id: 'billing', label: 'Plan & Billing', icon: Building2 },
          { id: 'security', label: 'Security & Account', icon: Shield },
          { id: 'preferences', label: 'Preferences', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {profileQuery.loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  <CardDescription>Update your contact details and founder profile shown on LeadBoard.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="prof-name">Full Name</Label>
                      <Input
                        id="prof-name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="prof-email">Email Address</Label>
                      <Input
                        id="prof-email"
                        value={email}
                        disabled
                        className="bg-muted/50 cursor-not-allowed"
                      />
                      <span className="text-[11px] text-muted-foreground">Managed by your sign-in identity</span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="prof-phone">Phone Number</Label>
                      <Input
                        id="prof-phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="prof-job">Job Title / Role</Label>
                      <Input
                        id="prof-job"
                        value={profileForm.jobTitle}
                        onChange={(e) => setProfileForm((p) => ({ ...p, jobTitle: e.target.value }))}
                        placeholder="Founder / Sales Director"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="prof-comp">Company / Business Name</Label>
                      <Input
                        id="prof-comp"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, companyName: e.target.value }))}
                        placeholder="Acme Studio"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="prof-bio">Short Bio / Company Summary</Label>
                    <Textarea
                      id="prof-bio"
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Brief note about your products or services..."
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      Member since {formatDate(clerkUser?.createdAt || dbUser?.createdAt)}
                    </span>
                    <Button type="submit" disabled={savingProfile}>
                      {savingProfile ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 size-4" />
                      )}
                      Save Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}

          {activeTab === 'billing' && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      Current Subscription: <span className="uppercase text-primary font-bold">{profileQuery.data?.subscription?.planName || 'Free'} Plan</span>
                    </CardTitle>
                    <CardDescription>Plan limits, feature access, and monthly AI usage tracking.</CardDescription>
                  </div>
                  {profileQuery.data?.subscription?.plan === 'free' && (
                    <Button onClick={() => toast.info('Stripe / Razorpay payment integration placeholder. Upgrade to Pro required.')}>
                      Upgrade to Pro
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>Lead Capacity</span>
                        <span className="text-muted-foreground">
                          {profileQuery.data?.subscription?.leadCount} / {profileQuery.data?.subscription?.maxLeads ?? '∞'} Leads
                        </span>
                      </div>
                      {profileQuery.data?.subscription?.maxLeads ? (
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                ((profileQuery.data?.subscription?.leadCount || 0) /
                                  profileQuery.data?.subscription?.maxLeads) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-500 font-medium">Unlimited Leads Available</p>
                      )}
                    </div>

                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>Monthly AI Actions</span>
                        <span className="text-muted-foreground">
                          {profileQuery.data?.subscription?.aiUsageCount} / {profileQuery.data?.subscription?.maxAiActionsPerMonth} Actions
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              ((profileQuery.data?.subscription?.aiUsageCount || 0) /
                                (profileQuery.data?.subscription?.maxAiActionsPerMonth || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-xs font-semibold mb-3">Plan Feature Comparison</p>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span>Lead Pipeline & Follow-ups</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span>In-App Overdue & Due Reminders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {profileQuery.data?.subscription?.features?.csvExport ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <Lock className="size-4 text-muted-foreground" />
                        )}
                        <span className={profileQuery.data?.subscription?.features?.csvExport ? '' : 'text-muted-foreground'}>
                          CSV Export (Pro Only)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {profileQuery.data?.subscription?.features?.csvImport ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <Lock className="size-4 text-muted-foreground" />
                        )}
                        <span className={profileQuery.data?.subscription?.features?.csvImport ? '' : 'text-muted-foreground'}>
                          CSV Import (Pro Only)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="size-4 text-primary" /> Clerk Security & Passwords
                  </CardTitle>
                  <CardDescription>
                    Your authentication, password changes, two-factor authentication, and connected devices are secured via Clerk.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Clerk Security Center</p>
                      <p className="text-xs text-muted-foreground">
                        Change your password, manage email addresses, active sessions, and 2FA credentials.
                      </p>
                    </div>
                    <Button onClick={openClerkProfile} variant="default" size="sm" className="shrink-0">
                      Manage Account & Password <ExternalLink className="ml-1.5 size-3.5" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    <div className="rounded-md border p-3 flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Single-User Ownership Isolated</p>
                        <p className="text-[11px] text-muted-foreground">Every lead and activity row is strictly isolated to your authenticated account ID.</p>
                      </div>
                    </div>
                    <div className="rounded-md border p-3 flex items-start gap-2.5">
                      <Shield className="size-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">Zero Local Password Storage</p>
                        <p className="text-[11px] text-muted-foreground">LeadBoard AI never stores raw or hashed passwords on app servers.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CRM Workspace Preferences</CardTitle>
                  <CardDescription>Tailor your layout, theme, and default table view sizes.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pref-size">Default Leads per Page</Label>
                      <Select
                        value={prefForm.itemsPerPage}
                        onValueChange={(val) => setPrefForm((p) => ({ ...p, itemsPerPage: val }))}
                      >
                        <SelectTrigger id="pref-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 leads</SelectItem>
                          <SelectItem value="20">20 leads (Default)</SelectItem>
                          <SelectItem value="50">50 leads</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pref-view">Default Lead Pipeline View</Label>
                      <Select
                        value={prefForm.defaultView}
                        onValueChange={(val) => setPrefForm((p) => ({ ...p, defaultView: val }))}
                      >
                        <SelectTrigger id="pref-view">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="table">Data Table View</SelectItem>
                          <SelectItem value="cards">Card Grid View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="pref-theme">Appearance Theme Mode</Label>
                      <Select
                        value={prefForm.theme}
                        onValueChange={(val) => setPrefForm((p) => ({ ...p, theme: val }))}
                      >
                        <SelectTrigger id="pref-theme">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System Default</SelectItem>
                          <SelectItem value="light">Light Mode</SelectItem>
                          <SelectItem value="dark">Dark Mode</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end border-t pt-4">
                    <Button type="submit" disabled={savingPref}>
                      {savingPref ? (
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 size-4" />
                      )}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </>
      )}
    </div>
  )
}