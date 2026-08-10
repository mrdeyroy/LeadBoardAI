import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
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
import { cn } from '@/lib/utils'

function isOverdue(dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due.getTime() < today.getTime()
}

function isToday(dueDate) {
  const today = new Date()
  const due = new Date(dueDate)
  return (
    due.getDate() === today.getDate() &&
    due.getMonth() === today.getMonth() &&
    due.getFullYear() === today.getFullYear()
  )
}

function FollowUpDialog({ open, onOpenChange, followUp, onSaved }) {
  const [form, setForm] = useState({ leadId: '', title: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const leadsQuery = useAsync(() => api('/leads?limit=100'), [])

  const isEditing = Boolean(followUp?.id)

  useEffect(() => {
    if (open) {
      if (followUp) {
        const d = followUp.dueDate ? new Date(followUp.dueDate).toISOString().slice(0, 10) : ''
        setForm({
          leadId: followUp.lead?.id || followUp.lead || '',
          title: followUp.title || '',
          dueDate: d,
        })
      } else {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const d = tomorrow.toISOString().slice(0, 10)
        setForm({ leadId: '', title: '', dueDate: d })
      }
      setError('')
    }
  }, [open, followUp])

  const leads = leadsQuery.data?.leads ?? []

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEditing) {
        await api(`/followups/${followUp.id}`, {
          method: 'PATCH',
          body: { title: form.title, dueDate: form.dueDate },
        })
        toast.success('Follow-up updated')
      } else {
        await api('/followups', { method: 'POST', body: form })
        toast.success('Follow-up scheduled')
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const canSubmit =
    (isEditing || Boolean(form.leadId)) &&
    Boolean(form.title.trim()) &&
    Boolean(form.dueDate) &&
    !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Follow-up' : 'New Follow-up'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update title or due date for this follow-up.'
              : 'Schedule a reminder to follow up with a lead.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEditing && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fu-lead">Lead</Label>
              {leadsQuery.loading ? (
                <Skeleton className="h-9 w-full" />
              ) : leads.length === 0 ? (
                <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
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
                        {lead.name} {lead.company ? `(${lead.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fu-title">Title / Action</Label>
              <Input
                id="fu-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Call to review proposal"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fu-due">Due Date</Label>
              <Input
                id="fu-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function FollowUps() {
  const [dialog, setDialog] = useState({ open: false, followUp: null })
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  const followUpsQuery = useAsync(() => api('/followups?limit=100'), [])
  const followUps = followUpsQuery.data?.followUps ?? []

  const counts = useMemo(() => {
    const overdue = followUps.filter((f) => !f.completed && isOverdue(f.dueDate)).length
    const today = followUps.filter((f) => !f.completed && isToday(f.dueDate)).length
    const upcoming = followUps.filter((f) => !f.completed && !isOverdue(f.dueDate) && !isToday(f.dueDate)).length
    const completed = followUps.filter((f) => f.completed).length
    return { all: followUps.length, overdue, today, upcoming, completed }
  }, [followUps])

  const filteredList = useMemo(() => {
    return followUps.filter((f) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const titleMatch = f.title.toLowerCase().includes(q)
        const leadMatch = f.lead?.name?.toLowerCase().includes(q)
        if (!titleMatch && !leadMatch) return false
      }

      if (activeTab === 'overdue') return !f.completed && isOverdue(f.dueDate)
      if (activeTab === 'today') return !f.completed && isToday(f.dueDate)
      if (activeTab === 'upcoming') return !f.completed && !isOverdue(f.dueDate) && !isToday(f.dueDate)
      if (activeTab === 'completed') return f.completed
      return true
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  }, [followUps, activeTab, search])

  const toggle = async (followUp) => {
    try {
      await api(`/followups/${followUp.id}`, {
        method: 'PATCH',
        body: { completed: !followUp.completed },
      })
      toast.success(followUp.completed ? 'Reopened follow-up' : 'Marked as completed!')
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

  const openEdit = (followUp) => {
    setDialog({ open: true, followUp })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Follow-ups</h2>
          <p className="text-sm text-muted-foreground">Stay on top of scheduled actions and reminders.</p>
        </div>
        <Button onClick={() => setDialog({ open: true, followUp: null })} size="sm">
          <Plus className="mr-1.5 size-4" /> New Follow-up
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 border-b pb-2 md:border-b-0 md:pb-0">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'overdue', label: 'Overdue', count: counts.overdue, badge: 'destructive' },
                { id: 'today', label: 'Due Today', count: counts.today, badge: 'warning' },
                { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                { id: 'completed', label: 'Completed', count: counts.completed },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px]',
                      activeTab === tab.id
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search follow-ups or lead…"
                className="w-full pl-8 pr-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {followUpsQuery.loading ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : followUpsQuery.error ? (
            <div className="flex items-center justify-between gap-4 py-8 text-destructive">
              <p className="text-sm">{followUpsQuery.error.message}</p>
              <Button variant="outline" size="sm" onClick={followUpsQuery.reload}>
                <RefreshCw className="mr-1.5 size-3.5" /> Retry
              </Button>
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title={search ? 'No matching follow-ups' : activeTab === 'overdue' ? 'No overdue follow-ups 🎉' : 'No follow-ups found'}
              description={
                search
                  ? 'Try a different search query.'
                  : activeTab === 'overdue'
                  ? 'Great job keeping up with all your leads!'
                  : 'Schedule follow-ups on leads to never lose a conversation.'
              }
              action={
                !search && activeTab === 'all' ? (
                  <Button size="sm" onClick={() => setDialog({ open: true, followUp: null })}>
                    <Plus className="mr-1.5 size-4" /> Schedule first follow-up
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filteredList.map((item) => {
                const overdue = !item.completed && isOverdue(item.dueDate)
                const dueToday = !item.completed && isToday(item.dueDate)

                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-all hover:shadow-xs',
                      item.completed ? 'bg-muted/30 opacity-75' : 'bg-card',
                      overdue && 'border-destructive/40 bg-destructive/5'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 hover:bg-muted"
                        onClick={() => toggle(item)}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="size-5 text-emerald-500" />
                        ) : (
                          <Circle className="size-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </Button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-medium text-foreground',
                              item.completed && 'line-through text-muted-foreground'
                            )}
                          >
                            {item.title}
                          </span>
                          {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                          {dueToday && <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px]">Due Today</Badge>}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {item.lead ? (
                            <Link to={`/leads/${item.lead.id}`} className="font-medium text-primary hover:underline">
                              {item.lead.name}
                            </Link>
                          ) : (
                            <span>Lead deleted</span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground/70" />
                            {formatDate(item.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(item)}
                        title="Edit follow-up"
                      >
                        <Edit2 className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(item)}
                        className="hover:text-destructive"
                        title="Delete follow-up"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <FollowUpDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        followUp={dialog.followUp}
        onSaved={followUpsQuery.reload}
      />
    </div>
  )
}