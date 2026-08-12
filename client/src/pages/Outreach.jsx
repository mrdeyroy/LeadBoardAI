import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCheck,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES, OUTREACH_CHANNELS, WEBSITE_STATUSES } from '@/lib/leads'
import { cn } from '@/lib/utils'

export default function Outreach() {
  const [activeTab, setActiveTab] = useState('today')
  const [search, setSearch] = useState('')
  const [websiteStatus, setWebsiteStatus] = useState('all')
  const [leadStatus, setLeadStatus] = useState('all')
  const [outreachChannel, setOutreachChannel] = useState('all')

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState([])

  // Modal dialog states
  const [bulkModal, setBulkModal] = useState({ open: false, action: '', payload: {} })
  const [bulkChannel, setBulkChannel] = useState('Cold Email')
  const [bulkDueDate, setBulkDueDate] = useState('')
  const [bulkTitle, setBulkTitle] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)

  // Single Follow-up modal
  const [fupModal, setFupModal] = useState({ open: false, leadId: null, leadName: '' })
  const [fupDueDate, setFupDueDate] = useState('')
  const [fupTitle, setFupTitle] = useState('')
  const [fupSubmitting, setFupSubmitting] = useState(false)

  // AI Modal
  const [aiModal, setAiModal] = useState({ open: false, lead: null })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState('')

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ limit: '200', sortBy: 'updatedAt', sortOrder: 'desc' })
    if (search) params.set('search', search)
    if (websiteStatus !== 'all') params.set('websiteStatus', websiteStatus)
    if (leadStatus !== 'all') params.set('status', leadStatus)
    if (outreachChannel !== 'all') params.set('outreachChannel', outreachChannel)
    return params.toString()
  }, [search, websiteStatus, leadStatus, outreachChannel])

  const { data, loading, reload } = useAsync(() => api(`/leads?${queryParams}`), [queryParams])
  const dashQuery = useAsync(() => api('/dashboard'), [])

  const allLeads = data?.leads || []
  const summary = dashQuery.data?.outreachSummary || {}

  // Outreach workspace tab filters & Needs Attention logic
  const { categorizedLeads, needsAttentionLeads } = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime()

    const today = allLeads.filter((l) => {
      const isNeverContacted = !l.lastContactedAt || l.status === 'New' || l.status === 'Researched'
      const hasFollowUpTodayOrOverdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() <= endOfToday
      return isNeverContacted || hasFollowUpTodayOrOverdue
    })

    const pending = allLeads.filter((l) => {
      if (!l.nextFollowUpAt) return ['New', 'Researched', 'Contacted'].includes(l.status)
      return new Date(l.nextFollowUpAt).getTime() < startOfToday
    })

    const contacted = allLeads.filter(
      (l) => Boolean(l.lastContactedAt) || ['Contacted', 'Replied', 'Qualified', 'Meeting', 'Proposal', 'Won'].includes(l.status)
    )

    const followups = allLeads.filter((l) => Boolean(l.nextFollowUpAt))

    const hot = allLeads.filter((l) => ['Qualified', 'Meeting', 'Proposal'].includes(l.status))

    const attention = allLeads.filter((l) => {
      const isOverdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt).getTime() < startOfToday
      const isRepliedNotQualified = l.status === 'Replied'
      const isQualifiedNoMeeting = l.status === 'Qualified'
      const isProposalNoFollowup = l.status === 'Proposal' && !l.nextFollowUpAt
      return isOverdue || isRepliedNotQualified || isQualifiedNoMeeting || isProposalNoFollowup
    })

    return {
      categorizedLeads: { today, pending, contacted, followups, hot, attention },
      needsAttentionLeads: attention,
    }
  }, [allLeads])

  const activeLeads = categorizedLeads[activeTab] || []

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === activeLeads.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(activeLeads.map((l) => l.id))
    }
  }

  const toggleSelectLead = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Quick single updates
  const updateOutreachQuick = async (leadId, fields, toastMsg = 'Outreach updated') => {
    try {
      await api(`/leads/${leadId}`, {
        method: 'PATCH',
        body: fields,
      })
      toast.success(toastMsg)
      reload()
      dashQuery.reload()
    } catch (err) {
      toast.error(err.message || 'Failed to update lead')
    }
  }

  // Bulk action submission
  const handleConfirmBulkAction = async () => {
    if (selectedIds.length === 0) return
    setBulkSubmitting(true)
    try {
      let payload = {}
      if (bulkModal.action === 'update_outreach_channel') {
        payload = { outreachChannel: bulkChannel }
      } else if (bulkModal.action === 'schedule_followup') {
        payload = { dueDate: bulkDueDate, title: bulkTitle || 'Outreach follow-up' }
      } else if (bulkModal.action === 'change_status') {
        payload = { status: bulkModal.payload.status }
      }

      const res = await api('/leads/bulk-update', {
        method: 'POST',
        body: {
          leadIds: selectedIds,
          action: bulkModal.action,
          payload,
        },
      })

      toast.success(`Updated ${res.updatedCount} prospects`)
      setSelectedIds([])
      setBulkModal({ open: false, action: '', payload: {} })
      reload()
      dashQuery.reload()
    } catch (err) {
      toast.error(err.message || 'Bulk update failed')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // Single follow-up schedule
  const handleSingleScheduleFollowUp = async (e) => {
    e.preventDefault()
    if (!fupModal.leadId || !fupDueDate) return
    setFupSubmitting(true)
    try {
      await api('/followups', {
        method: 'POST',
        body: {
          leadId: fupModal.leadId,
          title: fupTitle.trim() || 'Outreach follow-up',
          dueDate: fupDueDate,
        },
      })

      await api(`/leads/${fupModal.leadId}`, {
        method: 'PATCH',
        body: { nextFollowUpAt: new Date(fupDueDate).toISOString() },
      })

      toast.success('Follow-up scheduled')
      setFupModal({ open: false, leadId: null, leadName: '' })
      setFupTitle('')
      setFupDueDate('')
      reload()
      dashQuery.reload()
    } catch (err) {
      toast.error(err.message || 'Failed to schedule follow-up')
    } finally {
      setFupSubmitting(false)
    }
  }

  // Ask AI handler
  const handleAskAI = async (lead) => {
    setAiModal({ open: true, lead })
    setAiLoading(true)
    setAiAnalysis('')
    try {
      const res = await api('/ai/analyze', {
        method: 'POST',
        body: { leadId: lead.id },
      })
      setAiAnalysis(res.analysis || res.summary || 'AI completed outreach evaluation.')
    } catch (err) {
      setAiAnalysis(`AI Suggestion: Evaluate ${lead.company || lead.name}'s website (${lead.website || 'No website'}) and send a tailored cold message highlighting website redesign opportunities.`)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Outreach Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Daily agency cold-outreach execution, prospecting pipeline, and conversion analytics.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { reload(); dashQuery.reload() }} className="w-fit">
          <RefreshCw className="mr-1.5 size-3.5" /> Refresh
        </Button>
      </div>

      {/* Outreach Analytics Panel */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 text-center">
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Contacted</p>
            <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{summary.contacted ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Replies</p>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{summary.replied ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Meetings</p>
            <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{summary.meetings ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Proposals</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{summary.proposals ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Won</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{summary.won ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Reply Rate</p>
            <p className="text-lg font-bold text-foreground">{summary.replyRate ?? 0}%</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Meeting Rate</p>
            <p className="text-lg font-bold text-foreground">{summary.meetingRate ?? 0}%</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-2.5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase">Close Rate</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{summary.closeRate ?? 0}%</p>
          </div>
        </div>
      </Card>

      {/* Needs Attention Lightweight Banner */}
      {needsAttentionLeads.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="size-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Needs Attention ({needsAttentionLeads.length} prospects)
                </p>
                <p className="text-xs text-muted-foreground">
                  Prioritized: overdue follow-ups, unhandled replies, qualified without meetings, or proposal missing follow-up.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={activeTab === 'attention' ? 'default' : 'outline'}
              className="w-fit text-xs"
              onClick={() => setActiveTab('attention')}
            >
              Review Attention Queue ({needsAttentionLeads.length})
            </Button>
          </div>
        </Card>
      )}

      {/* 6 Outreach Workspace View Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        {[
          { id: 'today', label: "Today's Outreach", count: categorizedLeads.today.length, icon: Calendar },
          { id: 'pending', label: 'Pending Outreach', count: categorizedLeads.pending.length, icon: Clock },
          { id: 'contacted', label: 'Recently Contacted', count: categorizedLeads.contacted.length, icon: UserCheck },
          { id: 'followups', label: 'Follow-ups', count: categorizedLeads.followups.length, icon: Send },
          { id: 'hot', label: 'Hot Leads', count: categorizedLeads.hot.length, icon: Flame },
          { id: 'attention', label: 'Needs Attention', count: categorizedLeads.attention.length, icon: AlertTriangle },
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

      {/* Outreach Search & Filters */}
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
              {WEBSITE_STATUSES.map((ws) => (
                <SelectItem key={ws} value={ws}>
                  {ws}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={leadStatus} onValueChange={setLeadStatus}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Pipeline Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pipeline Statuses</SelectItem>
              {LEAD_STATUSES.map((st) => (
                <SelectItem key={st} value={st}>
                  {st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={outreachChannel} onValueChange={setOutreachChannel}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Filter Outreach Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {OUTREACH_CHANNELS.map((oc) => (
                <SelectItem key={oc} value={oc}>
                  {oc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Action Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-card p-3 shadow-xs">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={activeLeads.length > 0 && selectedIds.length === activeLeads.length}
            onChange={toggleSelectAll}
            className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
          />
          <span className="text-xs font-medium">
            {selectedIds.length > 0 ? `${selectedIds.length} of ${activeLeads.length} selected` : 'Select all prospects in this view'}
          </span>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setBulkModal({ open: true, action: 'update_outreach_channel', payload: {} })}
            >
              Update Channel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setBulkModal({ open: true, action: 'mark_contacted', payload: {} })}
            >
              <CheckCircle2 className="mr-1 size-3.5 text-emerald-500" /> Mark Contacted
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setBulkModal({ open: true, action: 'schedule_followup', payload: {} })}
            >
              <Calendar className="mr-1 size-3.5 text-blue-500" /> Schedule Follow-up
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setSelectedIds([])}
            >
              Deselect
            </Button>
          </div>
        )}
      </div>

      {/* Prospect List Cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : activeLeads.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No prospects found"
          description="No prospects match the selected outreach workspace view and filters."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeLeads.map((lead) => {
            const isSelected = selectedIds.includes(lead.id)
            return (
              <Card
                key={lead.id}
                className={cn(
                  'flex flex-col justify-between p-4 transition-all',
                  isSelected ? 'border-primary bg-primary/5' : ''
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLead(lead.id)}
                        className="mt-1 size-4 rounded border-input text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-semibold text-sm hover:underline hover:text-primary truncate block"
                        >
                          {lead.company || lead.name}
                        </Link>
                        {lead.contactPerson && (
                          <p className="text-xs text-muted-foreground truncate">
                            Contact: {lead.contactPerson} ({lead.name})
                          </p>
                        )}
                      </div>
                    </div>

                    <Select
                      value={lead.status}
                      onValueChange={(status) =>
                        updateOutreachQuick(lead.id, { status }, `Status changed to ${status}`)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((st) => (
                          <SelectItem key={st} value={st}>
                            {st}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                {/* Quick Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between border-t pt-3 mt-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                        title="Send Email"
                      >
                        <Mail className="size-3.5" />
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                        title="Call Phone"
                      >
                        <Phone className="size-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() =>
                        updateOutreachQuick(
                          lead.id,
                          {
                            lastContactedAt: new Date().toISOString(),
                            status: ['New', 'Researched'].includes(lead.status) ? 'Contacted' : lead.status,
                          },
                          'Marked as contacted today'
                        )
                      }
                    >
                      <CheckCircle2 className="mr-1 size-3 text-emerald-500" /> Contacted
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() =>
                        updateOutreachQuick(
                          lead.id,
                          { status: 'Replied' },
                          'Marked prospect as replied'
                        )
                      }
                    >
                      <MessageSquare className="mr-1 size-3 text-indigo-500" /> Replied
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => {
                        setFupModal({ open: true, leadId: lead.id, leadName: lead.company || lead.name })
                        setFupTitle(`Follow up with ${lead.company || lead.name}`)
                        setFupDueDate(new Date().toISOString().split('T')[0])
                      }}
                    >
                      <Calendar className="mr-1 size-3 text-blue-500" /> Remind
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handleAskAI(lead)}
                    >
                      <Sparkles className="mr-1 size-3 text-violet-500" /> AI
                    </Button>

                    <Button size="sm" asChild variant="ghost" className="h-7 px-2 text-[11px]">
                      <Link to={`/leads/${lead.id}`}>Details</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      <Dialog open={bulkModal.open} onOpenChange={(open) => setBulkModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              You are about to update {selectedIds.length} selected prospect{selectedIds.length === 1 ? '' : 's'}.
            </DialogDescription>
          </DialogHeader>

          {bulkModal.action === 'update_outreach_channel' && (
            <div className="flex flex-col gap-2 py-2">
              <Label className="text-xs font-medium">New Outreach Channel</Label>
              <Select value={bulkChannel} onValueChange={setBulkChannel}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTREACH_CHANNELS.map((oc) => (
                    <SelectItem key={oc} value={oc}>
                      {oc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {bulkModal.action === 'schedule_followup' && (
            <div className="flex flex-col gap-3 py-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Follow-up Title</Label>
                <Input
                  className="text-xs"
                  value={bulkTitle}
                  onChange={(e) => setBulkTitle(e.target.value)}
                  placeholder="e.g. Bulk follow-up attempt"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Due Date</Label>
                <Input
                  type="date"
                  className="text-xs"
                  value={bulkDueDate}
                  onChange={(e) => setBulkDueDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {bulkModal.action === 'mark_contacted' && (
            <p className="text-xs text-muted-foreground py-2">
              This will update the last contacted date to today and advance uncontacted prospects to "Contacted".
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkModal({ open: false, action: '', payload: {} })}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmBulkAction} disabled={bulkSubmitting}>
              {bulkSubmitting && <Loader2 className="mr-1.5 size-4 animate-spin" />} Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Schedule Follow-Up Modal */}
      <Dialog open={fupModal.open} onOpenChange={(open) => setFupModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Follow-up</DialogTitle>
            <DialogDescription>Schedule a reminder for {fupModal.leadName}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleScheduleFollowUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Task / Title</Label>
              <Input
                className="text-xs"
                value={fupTitle}
                onChange={(e) => setFupTitle(e.target.value)}
                placeholder="e.g. Send website redesign proposal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Due Date</Label>
              <Input
                type="date"
                className="text-xs"
                value={fupDueDate}
                onChange={(e) => setFupDueDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFupModal({ open: false, leadId: null, leadName: '' })}>
                Cancel
              </Button>
              <Button type="submit" disabled={fupSubmitting || !fupDueDate}>
                {fupSubmitting && <Loader2 className="mr-1.5 size-4 animate-spin" />} Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick AI Advice Modal */}
      <Dialog open={aiModal.open} onOpenChange={(open) => setAiModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-violet-500" /> AI Outreach Advisor
            </DialogTitle>
            <DialogDescription>
              Prospecting recommendations for {aiModal.lead?.company || aiModal.lead?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {aiLoading ? (
              <div className="flex flex-col gap-2 py-6 items-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs">Evaluating prospect website and outreach strategy...</p>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                {aiAnalysis}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAiModal({ open: false, lead: null })}>
              Close
            </Button>
            {aiModal.lead && (
              <Button asChild size="sm">
                <Link to={`/leads/${aiModal.lead.id}`}>Open Full Lead Assistant →</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
