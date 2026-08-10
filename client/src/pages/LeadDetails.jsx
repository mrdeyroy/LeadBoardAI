import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarClock,
  DollarSign,
  Globe,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

import { ActivityTimeline } from '@/components/activity/ActivityTimeline'
import { AIPanel } from '@/components/ai/AIPanel'
import { StatusBadge } from '@/components/leads/StatusBadge'
import { LeadDialog } from '@/components/leads/LeadDialog'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES } from '@/lib/leads'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function LoadingDetails() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64" />
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
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const leadQuery = useAsync(() => api(`/leads/${id}`), [id])
  const activityQuery = useAsync(() => api(`/leads/${id}/activities`), [id])

  const lead = leadQuery.data?.lead

  useEffect(() => {
    if (lead) setNotesDraft(lead.notes ?? '')
  }, [lead?.id, lead?.notes]) // eslint-disable-line react-hooks/exhaustive-deps

  const reloadAll = () => {
    leadQuery.reload()
    activityQuery.reload()
  }

  const changeStatus = async (status) => {
    if (status === lead.status) return
    try {
      await api(`/leads/${id}`, { method: 'PATCH', body: { status } })
      toast.success(`Status changed to ${status}`)
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

  const handleDelete = async () => {
    try {
      await api(`/leads/${id}`, { method: 'DELETE' })
      toast.success('Lead deleted')
      navigate('/leads')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (leadQuery.loading) return <LoadingDetails />

  if (leadQuery.error || !lead) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/leads">
            <ArrowLeft /> Back to leads
          </Link>
        </Button>
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-10">
            <div>
              <p className="font-medium">Couldn't load this lead</p>
              <p className="text-sm text-muted-foreground">
                {leadQuery.error?.message ?? 'It may have been deleted.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={leadQuery.reload}>
              <RefreshCw /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
        <Link to="/leads">
          <ArrowLeft /> Back to leads
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <StatusBadge status={lead.status} />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{lead.name}</h2>
            {lead.company && <p className="text-muted-foreground">{lead.company}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Requirement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{lead.requirement || 'No requirement recorded.'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Notes</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={saveNotes}
                disabled={savingNotes || notesDraft === lead.notes}
              >
                <Save /> {savingNotes ? 'Saving…' : 'Save'}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Add internal notes…"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity timeline</CardTitle>
              <CardDescription>Every change to this lead</CardDescription>
            </CardHeader>
            <CardContent>
              {activityQuery.loading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <ActivityTimeline activities={activityQuery.data?.activities ?? []} showLead={false} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <AIPanel leadId={lead.id} leadName={lead.name} onChanged={reloadAll} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <InfoRow icon={Mail} label="Email" value={lead.email} />
              <InfoRow icon={Phone} label="Phone" value={lead.phone} />
              <InfoRow icon={Building2} label="Company" value={lead.company} />
              <InfoRow icon={Globe} label="Source" value={lead.source} />
              <InfoRow icon={DollarSign} label="Budget" value={lead.budget} />
              <InfoRow icon={Calendar} label="Timeline" value={lead.timeline} />
              <InfoRow icon={CalendarClock} label="Created" value={formatDate(lead.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>Changes are tracked in the timeline.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Select value={lead.status} onValueChange={changeStatus}>
                <SelectTrigger>
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{lead.name}" and all of its follow-ups and activity. This
              action can't be undone.
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