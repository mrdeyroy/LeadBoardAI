import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Send,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Outreach() {
  const [activeTab, setActiveTab] = useState('today')
  const [search, setSearch] = useState('')
  const [websiteStatus, setWebsiteStatus] = useState('all')
  const [leadStatus, setLeadStatus] = useState('all')
  const [outreachChannel, setOutreachChannel] = useState('all')

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ limit: '100', sortBy: 'updatedAt', sortOrder: 'desc' })
    if (search) params.set('search', search)
    if (websiteStatus !== 'all') params.set('websiteStatus', websiteStatus)
    if (leadStatus !== 'all') params.set('status', leadStatus)
    if (outreachChannel !== 'all') params.set('outreachChannel', outreachChannel)
    return params.toString()
  }, [search, websiteStatus, leadStatus, outreachChannel])

  const { data, loading, reload } = useAsync(() => api(`/leads?${queryParams}`), [queryParams])

  const allLeads = data?.leads || []

  // Filtering logic for the 5 Outreach Workspace views
  const categorizedLeads = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()

    return {
      today: allLeads.filter((l) => {
        if (!l.nextFollowUpAt) return false
        const t = new Date(l.nextFollowUpAt).getTime()
        return t >= startOfToday && t <= endOfToday
      }),
      pending: allLeads.filter((l) => {
        if (!l.nextFollowUpAt) return l.status === 'New' || l.status === 'Contacted'
        return new Date(l.nextFollowUpAt).getTime() < startOfToday
      }),
      contacted: allLeads.filter((l) => l.lastContactedAt || l.status === 'Contacted'),
      followups: allLeads.filter((l) => Boolean(l.nextFollowUpAt)),
      hot: allLeads.filter((l) => ['Qualified', 'Proposal'].includes(l.status)),
    }
  }, [allLeads])

  const activeLeads = categorizedLeads[activeTab] || []

  const updateOutreachQuick = async (leadId, fields) => {
    try {
      await api(`/leads/${leadId}`, {
        method: 'PATCH',
        body: fields,
      })
      toast.success('Outreach updated')
      reload()
    } catch (err) {
      toast.error(err.message || 'Failed to update outreach')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Outreach Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Manage agency cold-prospecting pipeline, website audits, and outreach touchpoints.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reload} className="w-fit">
          <RefreshCw className="mr-1.5 size-3.5" /> Refresh
        </Button>
      </div>

      {/* 5 Core Outreach Workspace Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { id: 'today', label: "Today's Outreach", count: categorizedLeads.today.length, icon: Calendar },
          { id: 'pending', label: 'Pending Outreach', count: categorizedLeads.pending.length, icon: Clock },
          { id: 'contacted', label: 'Recently Contacted', count: categorizedLeads.contacted.length, icon: UserCheck },
          { id: 'followups', label: 'Follow-ups', count: categorizedLeads.followups.length, icon: Send },
          { id: 'hot', label: 'Hot Leads', count: categorizedLeads.hot.length, icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-start justify-between rounded-lg border p-3 text-left transition-all hover:border-primary/50',
                isActive ? 'border-primary bg-primary/5 shadow-xs' : 'bg-card'
              )}
            >
              <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                <Icon className={cn('size-4', isActive ? 'text-primary' : '')} />
                <span className="font-semibold text-foreground">{tab.count}</span>
              </div>
              <span className="mt-2 text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Outreach Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="relative col-span-1 sm:col-span-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search company, person, website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>

          <Select value={websiteStatus} onValueChange={setWebsiteStatus}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Website Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Website Statuses</SelectItem>
              <SelectItem value="No Website">No Website</SelectItem>
              <SelectItem value="Outdated Website">Outdated Website</SelectItem>
              <SelectItem value="Good Website">Good Website</SelectItem>
              <SelectItem value="Redesign Opportunity">Redesign Opportunity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leadStatus} onValueChange={setLeadStatus}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Lead Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lead Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={outreachChannel} onValueChange={setOutreachChannel}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="Cold Email">Cold Email</SelectItem>
              <SelectItem value="Phone">Phone</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Prospect List Cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : activeLeads.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No prospects found"
          description="No prospects match the selected outreach workspace filter."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeLeads.map((lead) => (
            <Card key={lead.id} className="flex flex-col justify-between p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/leads/${lead.id}`}
                      className="font-semibold text-sm hover:underline hover:text-primary"
                    >
                      {lead.company || lead.name}
                    </Link>
                    {lead.contactPerson && (
                      <p className="text-xs text-muted-foreground">
                        Contact: {lead.contactPerson} ({lead.name})
                      </p>
                    )}
                  </div>
                  <StatusBadge status={lead.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="size-3" /> {lead.website} <ExternalLink className="size-2.5" />
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Globe className="size-3" /> No Website
                    </span>
                  )}
                  {lead.industry && <span>• {lead.industry}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-2.5 text-[11px] mt-2">
                  <div>
                    <span className="text-muted-foreground block">Website Audit</span>
                    <span className="font-medium">{lead.websiteStatus || 'No Website'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Channel</span>
                    <span className="font-medium">{lead.outreachChannel || 'Cold Email'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Last Contacted</span>
                    <span className="font-medium">
                      {lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Next Follow-Up</span>
                    <span className="font-medium">
                      {lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : 'Not scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-3 text-xs">
                <div className="flex items-center gap-2">
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="text-muted-foreground hover:text-primary">
                      <Mail className="size-3.5" />
                    </a>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-primary">
                      <Phone className="size-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() =>
                      updateOutreachQuick(lead.id, {
                        lastContactedAt: new Date().toISOString(),
                        status: lead.status === 'New' ? 'Contacted' : lead.status,
                      })
                    }
                  >
                    <CheckCircle2 className="mr-1 size-3 text-emerald-500" /> Mark Contacted Today
                  </Button>
                  <Button size="sm" asChild className="h-7 px-2 text-[11px]">
                    <Link to={`/leads/${lead.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
