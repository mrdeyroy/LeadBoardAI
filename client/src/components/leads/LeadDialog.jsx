import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { ApiError, api } from '@/lib/api'
import { emptyLead, LEAD_STATUSES, OUTREACH_CHANNELS, SOURCES, WEBSITE_STATUSES } from '@/lib/leads'

const FIELDS = [
  ['name', 'Prospect / Lead Name'],
  ['company', 'Company / Business Name'],
  ['contactPerson', 'Contact Person'],
  ['email', 'Email Address'],
  ['phone', 'Phone Number'],
  ['website', 'Website URL'],
  ['industry', 'Industry / Niche'],
  ['websiteStatus', 'Website Status'],
  ['outreachChannel', 'Outreach Channel'],
  ['source', 'Source'],
  ['status', 'Status'],
  ['budget', 'Budget'],
  ['timeline', 'Timeline'],
] 

export function LeadDialog({ open, onOpenChange, lead, onSaved }) {
  const [form, setForm] = useState(emptyLead)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const editing = Boolean(lead)

  useEffect(() => {
    if (open) {
      setForm(lead ? { ...emptyLead, ...lead } : emptyLead)
      setError('')
    }
  }, [open, lead])

  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api(`/leads/${lead.id}`, { method: 'PATCH', body: form })
      } else {
        await api('/leads', { method: 'POST', body: form })
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setError(Object.values(err.details)[0])
      } else {
        setError(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit lead' : 'New lead'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the details for this lead.'
              : 'Add a new lead to your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <Label htmlFor={`lead-${key}`}>{label}</Label>
                {key === 'source' ? (
                  <Select value={form.source} onValueChange={(value) => setForm((p) => ({ ...p, source: value }))}>
                    <SelectTrigger id={`lead-${key}`}>
                      <SelectValue placeholder="Select a source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : key === 'status' ? (
                  <Select value={form.status} onValueChange={(value) => setForm((p) => ({ ...p, status: value }))}>
                    <SelectTrigger id={`lead-${key}`}>
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
                ) : key === 'websiteStatus' ? (
                  <Select value={form.websiteStatus || 'No Website'} onValueChange={(value) => setForm((p) => ({ ...p, websiteStatus: value }))}>
                    <SelectTrigger id={`lead-${key}`}>
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
                ) : key === 'outreachChannel' ? (
                  <Select value={form.outreachChannel || 'Cold Email'} onValueChange={(value) => setForm((p) => ({ ...p, outreachChannel: value }))}>
                    <SelectTrigger id={`lead-${key}`}>
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
                ) : (
                  <Input
                    id={`lead-${key}`}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder={key === 'name' ? 'Jane Cooper' : undefined}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-requirement">Requirement</Label>
            <Textarea
              id="lead-requirement"
              rows={3}
              value={form.requirement}
              onChange={set('requirement')}
              placeholder="What is the lead looking for?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lead-notes">Notes</Label>
            <Textarea
              id="lead-notes"
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Internal notes about this lead…"
            />
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {editing ? 'Save changes' : 'Create lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}