import { useRef, useState } from 'react'
import {
  CalendarClock,
  Check,
  Copy,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ScanSearch,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

const QUALITY_BADGE = {
  High: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Low: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

const TONES = [
  { id: 'short', label: 'Short' },
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
]

function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dueDateInDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + (Number.isInteger(days) ? days : 1))
  return isoDate(date)
}

function describeProposal(action) {
  const { tool, params } = action
  if (tool === 'updateLeadStatus') return `Change status to ${params.status}`
  if (tool === 'addLeadNote') {
    const content = typeof params.content === 'string' ? params.content : ''
    return `Add note: ${content.slice(0, 40)}${content.length > 40 ? '…' : ''}`
  }
  if (tool === 'createFollowUp') return `Schedule follow-up: ${params.title}`
  return `Run ${tool}`
}

function ActionButton({ icon: Icon, label, busy, onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4 text-primary" />}
      {label}
    </Button>
  )
}

function AnalysisView({ analysis }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Analysis
        </span>
        <Badge variant="outline" className={QUALITY_BADGE[analysis.quality] ?? undefined}>
          {analysis.quality} quality
        </Badge>
      </div>
      <p>{analysis.summary}</p>
      {analysis.intent && (
        <p>
          <span className="text-muted-foreground">Intent: </span>
          {analysis.intent}
        </p>
      )}
      {analysis.requirements?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Requirements</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {analysis.requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis.missingInformation?.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Missing information</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {analysis.missingInformation.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {analysis.recommendedNextAction && (
        <p className="rounded-md bg-primary/5 p-2 text-xs">
          <span className="font-medium">Recommended next: </span>
          {analysis.recommendedNextAction}
        </p>
      )}
    </div>
  )
}

function ReplyView({ reply, onCopy }) {
  const [draft, setDraft] = useState(reply)
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drafted reply
        </span>
        <Button variant="outline" size="sm" onClick={() => onCopy(draft)}>
          <Copy /> Copy
        </Button>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        className="resize-none bg-background text-sm"
      />
      <p className="text-right text-[11px] text-muted-foreground">Edit before copying if needed.</p>
    </div>
  )
}

function QualifyView({ current, recommendation }) {
  const changed = current !== recommendation.status
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Qualification
        </span>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{current}</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge className={changed ? 'bg-primary text-primary-foreground' : undefined}>
            {recommendation.status}
          </Badge>
        </div>
      </div>
      <p>{recommendation.reason}</p>
      {!changed && (
        <p className="text-xs text-muted-foreground">
          The AI recommends keeping this lead at its current status — nothing to change.
        </p>
      )}
    </div>
  )
}

function TimingView({ recommendation }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Follow-up timing
        </span>
        <Badge>
          {Number.isInteger(recommendation.dueInDays)
            ? `In ${recommendation.dueInDays} day${recommendation.dueInDays === 1 ? '' : 's'}`
            : 'Suggested'}
        </Badge>
      </div>
      <p>{recommendation.reason}</p>
    </div>
  )
}

function ProposalCard({ proposal, busy, onConfirm, onCancel }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 shrink-0 text-primary" />
          Proposed by AI — requires your confirmation
        </div>
        <Button variant="ghost" size="icon" className="size-6" onClick={onCancel}>
          <X className="size-3.5" />
        </Button>
      </div>
      <p className="text-sm">{proposal.label}</p>
      {proposal.reason && <p className="text-xs text-muted-foreground">{proposal.reason}</p>}
      <Button size="sm" className="mt-1 w-full" disabled={busy} onClick={() => onConfirm(proposal)}>
        <Check /> Confirm & run
      </Button>
    </div>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'border bg-card text-foreground'
        }`}
      >
        {message.text}
      </div>
    </div>
  )
}

function FitView({ fit }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-muted-foreground uppercase">Agency Prospect Fit</span>
        <Badge variant="outline" className="bg-primary/10 text-primary font-bold">
          {fit.fitRating} ({fit.fitScore}/100)
        </Badge>
      </div>
      {fit.reasons?.length > 0 && (
        <div>
          <span className="font-semibold block text-foreground mb-1">Key Fit Drivers</span>
          <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
            {fit.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {fit.auditOpportunities?.length > 0 && (
        <div>
          <span className="font-semibold block text-foreground mb-1">Audit Opportunities</span>
          <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
            {fit.auditOpportunities.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
      {fit.recommendedPitch && (
        <div className="rounded border bg-card p-2">
          <span className="font-semibold text-primary block mb-0.5">Recommended Pitch:</span>
          <span className="text-foreground">{fit.recommendedPitch}</span>
        </div>
      )}
    </div>
  )
}

function DraftOutreachView({ draft, onCopy }) {
  const [subject, setSubject] = useState(draft.subject || '')
  const [body, setBody] = useState(draft.body || '')
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-muted-foreground uppercase">Editable Outreach Draft</span>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onCopy(`${subject}\n\n${body}`)}>
          <Copy className="mr-1 size-3" /> Copy
        </Button>
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Subject</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-7 text-xs bg-background" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-muted-foreground block mb-1">Body</label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="text-xs bg-background resize-none" />
      </div>
    </div>
  )
}

export function AIPanel({ leadId, leadName, leadStatus, onChanged }) {
  const idRef = useRef(0)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [tone, setTone] = useState('professional')
  const [outreachType, setOutreachType] = useState('first_cold')
  const [proposals, setProposals] = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const nextKey = () => `p${++idRef.current}`

  const run = async (type, sender) => {
    if (busy) return
    setBusy(type)
    setError('')
    setResult(null)
    try {
      const data = await sender()
      if (type === 'analyze') {
        setResult({ type, data: data.analysis })
      } else if (type === 'reply') {
        setResult({ type, data: data.reply })
      } else if (type === 'fit') {
        setResult({ type, data: data.fit })
      } else if (type === 'draft') {
        setResult({ type, data })
      } else {
        const rec = data.recommendation
        if (type === 'qualify' && rec.status !== leadStatus) {
          setProposals((p) => [
            ...p,
            {
              key: nextKey(),
              label: `Change status to "${rec.status}"`,
              reason: rec.reason || `AI recommends "${rec.status}".`,
              tool: 'updateLeadStatus',
              params: { leadId, status: rec.status },
            },
          ])
        }
        if (type === 'timing') {
          setProposals((p) => [
            ...p,
            {
              key: nextKey(),
              label: rec.title || `Follow up with ${leadName}`,
              reason: rec.reason || 'AI suggested a follow-up.',
              tool: 'createFollowUp',
              params: {
                leadId,
                title: rec.title || `Follow up with ${leadName}`,
                dueDate: dueDateInDays(rec.dueInDays),
              },
            },
          ])
        }
        setResult({ type, data: rec })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const chooseTone = (next) => {
    setTone(next)
    if (next !== tone && result?.type === 'reply') {
      run('reply', () => api('/ai/reply', { method: 'POST', body: { leadId, tone: next } }))
    }
  }

  const sendChat = async (event) => {
    event?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setError('')
    const history = messages.slice(-12).map((m) => ({ role: m.role, text: m.text }))
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy('chat')
    try {
      const data = await api('/ai/chat', { method: 'POST', body: { leadId, message: text, history } })
      if (data.reply) setMessages((m) => [...m, { role: 'assistant', text: data.reply }])
      const suggest = (data.actions ?? []).map((a) => ({
        key: nextKey(),
        label: describeProposal(a),
        reason: '',
        tool: a.tool,
        params: a.params ?? {},
      }))
      if (suggest.length > 0) setProposals((p) => [...p, ...suggest])
    } catch (err) {
      setError(err.message)
      setMessages((m) => [...m, { role: 'assistant', text: `Sorry — ${err.message}` }])
    } finally {
      setBusy(null)
    }
  }

  const confirmProposal = async (proposal) => {
    setBusy(`exec`)
    try {
      await api('/ai/actions', {
        method: 'POST',
        body: { tool: proposal.tool, params: proposal.params },
      })
      toast.success('Action applied')
      setProposals((p) => p.filter((x) => x.key !== proposal.key))
      setMessages((m) => [...m, { role: 'assistant', text: `Done — ${proposal.label}.` }])
      onChanged?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  const dismissProposal = (key) => {
    setProposals((p) => p.filter((x) => x.key !== key))
  }

  const copyReply = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <Card className="lg:sticky lg:top-16">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          AI Agency Sales Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={ScanSearch}
            label="Analyze"
            busy={busy === 'analyze'}
            onClick={() => run('analyze', () => api('/ai/analyze', { method: 'POST', body: { leadId } }))}
          />
          <ActionButton
            icon={Target}
            label="Lead Fit"
            busy={busy === 'fit'}
            onClick={() => run('fit', () => api('/ai/fit-analysis', { method: 'POST', body: { leadId } }))}
          />
          <ActionButton
            icon={MessageSquareText}
            label="Draft Outreach"
            busy={busy === 'draft'}
            onClick={() =>
              run('draft', () =>
                api('/ai/draft-outreach', { method: 'POST', body: { leadId, type: outreachType, tone } })
              )
            }
          />
          <ActionButton
            icon={CalendarClock}
            label="Timing"
            busy={busy === 'timing'}
            onClick={() => run('timing', () => api('/ai/timing', { method: 'POST', body: { leadId } }))}
          />
        </div>

        <div className="flex flex-col gap-2 rounded-md border p-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Outreach Type:</span>
            <select
              value={outreachType}
              onChange={(e) => setOutreachType(e.target.value)}
              className="h-6 text-[11px] rounded border bg-background px-1.5"
            >
              <option value="first_cold">First Cold</option>
              <option value="follow_up">Follow-up</option>
              <option value="post_call">Post-Call</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] font-medium text-muted-foreground">Tone:</span>
            {TONES.map((t) => (
              <Button
                key={t.id}
                variant={tone === t.id ? 'default' : 'ghost'}
                size="sm"
                className="h-6 px-1.5 text-[11px]"
                disabled={busy !== null}
                onClick={() => chooseTone(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </p>
        )}

        {result?.type === 'analyze' && <AnalysisView analysis={result.data} />}
        {result?.type === 'fit' && <FitView fit={result.data} />}
        {result?.type === 'draft' && <DraftOutreachView draft={result.data} onCopy={copyReply} />}
        {result?.type === 'reply' && <ReplyView reply={result.data} onCopy={copyReply} />}
        {result?.type === 'qualify' && (
          <QualifyView current={leadStatus} recommendation={result.data} />
        )}
        {result?.type === 'timing' && <TimingView recommendation={result.data} />}

        {proposals.length > 0 && (
          <div className="flex flex-col gap-2">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.key}
                proposal={proposal}
                busy={busy !== null}
                onConfirm={confirmProposal}
                onCancel={() => dismissProposal(proposal.key)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Ask about this lead</p>
          <div className="flex max-h-52 min-h-16 flex-col gap-2 overflow-y-auto rounded-lg border bg-muted/40 p-3">
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Try "What should I ask next?" — I can draft replies, qualify the lead, update its
                status or schedule a follow-up with your approval.
              </p>
            ) : (
              messages.map((message, i) => <ChatBubble key={i} message={message} />)
            )}
          </div>
          <form onSubmit={sendChat} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={busy ? 'Working…' : 'Message the assistant…'}
              disabled={busy !== null}
            />
            <Button type="submit" size="icon" disabled={busy !== null || !input.trim()}>
              <Send />
            </Button>
          </form>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <RefreshCw className="size-3" />
          Proposed actions only run after you confirm them.
        </p>
      </CardContent>
    </Card>
  )
}