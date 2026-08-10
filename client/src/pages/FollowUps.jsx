import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

function isOverdue(dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}

function FollowUpDialog({ open, onOpenChange, onSaved }) {
  const [form, setForm] = useState({ leadId: '', title: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const leadsQuery = useAsync(() => api('/leads?limit=50'), [])

  useEffect(() => {
    if (open) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const y = tomorrow.getFullYear()
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const d = String(tomorrow.getDate()).padStart(2, '0')
      setForm({ leadId: '', title: '', dueDate: `${y}-${m}-${d}` })
      setError('')
    }
  }, [open])

  const leads = leadsQuery.data?.leads ?? []

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api('/followups', { method: 'POST', body: form })
      toast.success('Follow-up scheduled')
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    Boolean(form.leadId) && Boolean(form.title.trim()) && Boolean(form.dueDate) && !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New follow-up</DialogTitle>
          <DialogDescription>Schedule a reminder to follow up with a lead.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fu-lead">Lead</Label>
            {leadsQuery.loading ? (
              <Skeleton className="h-9 w-full" />
            ) : leads.length === 0 ? (
              <p className="rounded-md border bg-muted/40 p-2 text-sm text-muted-foreground">
                You need at least one lead to schedule a follow-up.
              </p>
            ) : (
              <Select
                value={form.leadId}
                onValueChange={(value) => setForm((p) => ({ ...p, leadId: value }))}
              >
                <SelectTrigger id="fu-lead">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.company ? ` — ${lead.company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-title">Title</Label>
              <Input
                id="fu-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Demo call"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-due">Due date</Label>
              <Input
                id="fu-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving && <Loader2 className="animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FollowUps() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const followUpsQuery = useAsync(() => api('/followups?limit=100'), [])

  const followUps = followUpsQuery.data?.followUps ?? []

  const upcoming = followUps
    .filter((f) => !f.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const completed = followUps.filter((f) => f.completed)

  const toggle = async (followUp) => {
    try {
      await api(`/followups/${followUp.id}`, {
        method: 'PATCH',
        body: { completed: !followUp.completed },
      })
      toast.success(followUp.completed ? 'Marked as pending' : 'Follow-up completed')
      followUpsQuery.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const remove = async (followUp) => {
    if (!window.confirm(`Delete "${followUp.title}"?`)) return
    try {
      await api(`/followups/${followUp.id}`, { method: 'DELETE' })
      toast.success('Follow-up deleted')
      followUpsQuery.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const renderItem = (followUp) => (
    <li key={followUp.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => toggle(followUp)}
        aria-label={followUp.completed ? 'Mark as pending' : 'Mark as completed'}
      >
        {followUp.completed ? (
          <CheckCircle2 className="size-5 text-emerald-500" />
        ) : (
          <Circle className="size-5 text-muted-foreground" />
        )}
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              followUp.completed && 'text-muted-foreground line-through'
            )}
          >
            {followUp.title}
          </p>
          {!followUp.completed && isOverdue(followUp.dueDate) && (
            <Badge variant="destructive">Overdue</Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          {followUp.lead ? (
            <Link to={`/leads/${followUp.lead.id}`} className="font-medium text-primary hover:underline">
              {followUp.lead.name}
            </Link>
          ) : (
            <span>Lead deleted</span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3" />
            {formatDate(followUp.dueDate)}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => remove(followUp)}
        aria-label="Delete follow-up"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Follow-ups</h2>
          <p className="text-sm text-muted-foreground">Keep track of what needs your attention.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus /> New follow-up
        </Button>
      </div>

      {followUpsQuery.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : followUpsQuery.error ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-10">
            <div>
              <p className="font-medium">Couldn't load follow-ups</p>
              <p className="text-sm text-muted-foreground">{followUpsQuery.error.message}</p>
            </div>
            <Button variant="outline" size="sm" onClick={followUpsQuery.reload}>
              <RefreshCw /> Retry
            </Button>
          </CardContent>
        </Card>
      ) : followUps.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={CalendarClock}
              title="No follow-ups yet"
              description="Schedule a follow-up with a lead so you never miss a conversation."
              action={
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus /> Create your first follow-up
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming</CardTitle>
              <CardDescription>Open follow-ups sorted by due date.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing due — you're all caught up.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">{upcoming.map(renderItem)}</ul>
              )}
            </CardContent>
          </Card>

          {completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Completed</CardTitle>
                <CardDescription>Follow-ups you've wrapped up.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">{completed.map(renderItem)}</ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <FollowUpDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={followUpsQuery.reload}
      />
    </div>
  )
}