import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  DollarSign,
  Globe,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { ActivityTimeline } from '@/components/activity/ActivityTimeline'
import { AIPanel } from '@/components/ai/AIPanel'
import { LeadDialog } from '@/components/leads/LeadDialog'
import { StatusBadge } from '@/components/leads/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { Textarea } from '@/components/ui/textarea'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES, OUTREACH_CHANNELS, WEBSITE_STATUSES } from '@/lib/leads'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function LoadingDetails() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

export default function LeadDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [activityTab, setActivityTab] = useState('all')

  const [fuTitle, setFuTitle] = useState('')
  const [fuDueDate, setFuDueDate] = useState('')
  const [fuSaving, setFuSaving] = useState(false)

  const leadQuery = useAsync(() => api(`/leads/${id}`), [id])
  const activityQuery = useAsync(() => api(`/leads/${id}/activities`), [id])
  const followUpsQuery = useAsync(() => api('/followups?limit=100'), [])

  const lead = leadQuery.data?.lead
  const allFollowUps = followUpsQuery.data?.followUps ?? []
  const leadFollowUps = useMemo(() => {
    return allFollowUps.filter((f) => f.lead?.id === id || f.lead === id)
  }, [allFollowUps, id])

  useEffect(() => {
    if (lead) setNotesDraft(lead.notes ?? '')
  }, [lead?.id, lead?.notes])

  const reloadAll = () => {
    leadQuery.reload()
    activityQuery.reload()
    followUpsQuery.reload()
  }

  const changeStatus = async (status) => {
    if (status === lead.status) return
    try {
      await api(`/leads/${id}`, { method: 'PATCH', body: { status } })
      toast.success(`Status updated to ${status}`)
      reloadAll()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await api(`/leads/${id}`, { method: 'PATCH', body: { notes: notesDraft } })
      toast.success('Notes saved')
      reloadAll()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  const handleAddFollowUp = async (e) => {
    e.preventDefault()
    if (!fuTitle.trim() || !fuDueDate) return
    setFuSaving(true)
    try {
      await api('/followups', {
        method: 'POST',
        body: { leadId: id, title: fuTitle, dueDate: fuDueDate },
      })
      toast.success('Follow-up added')
      setFuTitle('')
      setFuDueDate('')
      setFollowUpOpen(false)
      reloadAll()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setFuSaving(false)
    }
  }

  const toggleFollowUp = async (fu) => {
    try {
      await api(`/followups/${fu.id}`, {
        method: 'PATCH',
        body: { completed: !fu.completed },
      })
      toast.success(fu.completed ? 'Reopened follow-up' : 'Follow-up completed')
      reloadAll()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await api(`/leads/${id}`, { method: 'DELETE' })
      toast.success('Lead deleted')
      navigate('/leads')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filteredActivities = useMemo(() => {
    const list = activityQuery.data?.activities ?? []
    if (activityTab === 'status') return list.filter((a) => a.type === 'status_changed')
    if (activityTab === 'note') return list.filter((a) => a.type === 'note_added')
    if (activityTab === 'ai') return list.filter((a) => a.type.startsWith('ai_'))
    return list
  }, [activityQuery.data, activityTab])

  if (leadQuery.loading) return <LoadingDetails />

  if (leadQuery.error || !lead) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/leads">
            <ArrowLeft className="mr-1.5 size-4" /> Back to leads
          </Link>
        </Button>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-10">
            <div>
              <p className="font-medium">Couldn't load lead details</p>
              <p className="text-sm text-muted-foreground">
                {leadQuery.error?.message ?? 'Lead might have been removed.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={leadQuery.reload}>
              <RefreshCw className="mr-1.5 size-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/leads">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{lead.name}</h2>
              <StatusBadge status={lead.status} />
            </div>
            {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={lead.status} onValueChange={changeStatus}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setFollowUpOpen(true)}>
            <Plus className="mr-1.5 size-3.5" /> Remind
          </Button>

          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 size-3.5" /> Edit
          </Button>

          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Requirement & Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {lead.requirement || 'No specific requirements recorded yet.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Scheduled Follow-ups</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setFollowUpOpen(true)}>
                <Plus className="mr-1.5 size-3.5" /> Add Follow-up
              </Button>
            </CardHeader>
            <CardContent>
              {leadFollowUps.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No scheduled follow-ups for this lead.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {leadFollowUps.map((fu) => (
                    <li
                      key={fu.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-2.5 text-xs hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button onClick={() => toggleFollowUp(fu)} className="shrink-0">
                          {fu.completed ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className={fu.completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                          {fu.title}
                        </span>
                      </div>
                      <span className="shrink-0 text-muted-foreground">{formatDate(fu.dueDate)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">Internal Notes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes || notesDraft === lead.notes}
              >
                <Save className="mr-1.5 size-3.5" /> {savingNotes ? 'Saving…' : 'Save Notes'}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Write private call notes, deal requirements, or follow-up details..."
                className="text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                  <CardDescription>Full audit log of changes and AI actions</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'status', label: 'Status' },
                    { id: 'note', label: 'Notes' },
                    { id: 'ai', label: 'AI Actions' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActivityTab(t.id)}
                      className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                        activityTab === t.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activityQuery.loading ? (
                <div className="flex flex-col gap-3 py-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <ActivityTimeline activities={filteredActivities} showLead={false} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <AIPanel
            leadId={lead.id}
            leadName={lead.name}
            leadStatus={lead.status}
            onChanged={reloadAll}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outreach Management</CardTitle>
              <CardDescription>Update agency cold-outreach status and follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Website Status Audit</Label>
                <Select
                  value={lead.websiteStatus || 'No Website'}
                  onValueChange={(val) =>
                    api(`/leads/${lead.id}`, { method: 'PATCH', body: { websiteStatus: val } })
                      .then(() => {
                        toast.success('Website status updated')
                        reloadAll()
                      })
                      .catch((err) => toast.error(err.message))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBSITE_STATUSES.map((ws) => (
                      <SelectItem key={ws} value={ws}>
                        {ws}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Outreach Channel</Label>
                <Select
                  value={lead.outreachChannel || 'Cold Email'}
                  onValueChange={(val) =>
                    api(`/leads/${lead.id}`, { method: 'PATCH', body: { outreachChannel: val } })
                      .then(() => {
                        toast.success('Outreach channel updated')
                        reloadAll()
                      })
                      .catch((err) => toast.error(err.message))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
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

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Last Contacted Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={lead.lastContactedAt ? new Date(lead.lastContactedAt).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    api(`/leads/${lead.id}`, {
                      method: 'PATCH',
                      body: { lastContactedAt: e.target.value ? new Date(e.target.value).toISOString() : null },
                    })
                      .then(() => {
                        toast.success('Last contacted date updated')
                        reloadAll()
                      })
                      .catch((err) => toast.error(err.message))
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-medium text-muted-foreground uppercase">Next Follow-Up Date</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    api(`/leads/${lead.id}`, {
                      method: 'PATCH',
                      body: { nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : null },
                    })
                      .then(() => {
                        toast.success('Next follow-up date updated')
                        reloadAll()
                      })
                      .catch((err) => toast.error(err.message))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lead & Prospect Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              <InfoRow icon={Building2} label="Company / Business Name" value={lead.company} />
              <InfoRow icon={Pencil} label="Contact Person" value={lead.contactPerson} />
              <InfoRow icon={Mail} label="Email Address" value={lead.email} />
              <InfoRow icon={Phone} label="Phone Number" value={lead.phone} />
              <InfoRow icon={Globe} label="Website URL" value={lead.website} />
              <InfoRow icon={Building2} label="Industry / Niche" value={lead.industry} />
              <InfoRow icon={Globe} label="Lead Source" value={lead.source} />
              <InfoRow icon={DollarSign} label="Estimated Budget" value={lead.budget} />
              <InfoRow icon={Calendar} label="Target Timeline" value={lead.timeline} />
              <InfoRow icon={CalendarClock} label="Date Created" value={formatDate(lead.createdAt)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <LeadDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        lead={lead}
        onSaved={reloadAll}
      />

      <Dialog open={followUpOpen} onOpenChange={setFollowUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Follow-up for {lead.name}</DialogTitle>
            <DialogDescription>Schedule a task or reminder on this lead.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddFollowUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-fu-title">Title / Task</Label>
              <Input
                id="lead-fu-title"
                value={fuTitle}
                onChange={(e) => setFuTitle(e.target.value)}
                placeholder="e.g. Call to discuss contract"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lead-fu-date">Due Date</Label>
              <Input
                id="lead-fu-date"
                type="date"
                value={fuDueDate}
                onChange={(e) => setFuDueDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFollowUpOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={fuSaving || !fuTitle.trim() || !fuDueDate}>
                {fuSaving ? 'Scheduling…' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{lead.name}" and all of its follow-ups and activity records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}