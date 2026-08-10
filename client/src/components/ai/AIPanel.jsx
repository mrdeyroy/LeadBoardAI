import { useRef, useState } from 'react'
import {
  CalendarClock,
  Check,
  Copy,
  Loader2,
  MessageSquareText,
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
import { api } from '@/lib/api'

const QUALITY_BADGE = {
  High: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Low: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

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
  if (tool === 'addLeadNote') return 'Add a note to this lead'
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
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Drafted reply
        </span>
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy /> Copy
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm">{reply}</p>
    </div>
  )
}

function ProposalCard({ proposal, busy, onConfirm, onCancel }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 shrink-0 text-primary" />
          Suggested action
        </div>
        <Button variant="ghost" size="icon" className="size-6" onClick={onCancel}>
          <X className="size-3.5" />
        </Button>
      </div>
      <p className="text-sm">{proposal.label}</p>
      {proposal.reason && <p className="text-xs text-muted-foreground">{proposal.reason}</p>}
      <Button size="sm" className="mt-1 w-full" disabled={busy} onClick={() => onConfirm(proposal)}>
        <Check /> Confirm
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

export function AIPanel({ leadId, leadName, onChanged }) {
  const idRef = useRef(0)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
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
      } else {
        const rec = data.recommendation
        const proposal =
          type === 'qualify'
            ? {
                key: nextKey(),
                label: `Change status to "${rec.status}"`,
                reason: rec.reason || `AI recommends "${rec.status}".`,
                tool: 'updateLeadStatus',
                params: { leadId, status: rec.status },
              }
            : {
                key: nextKey(),
                label: `Follow up with ${leadName}`,
                reason: rec.reason || 'AI suggested a follow-up.',
                tool: 'createFollowUp',
                params: {
                  leadId,
                  title: `Follow up with ${leadName}`,
                  dueDate: dueDateInDays(rec.dueInDays),
                },
              }
        setResult({ type, data: rec })
        setProposals((p) => [...p, proposal])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  const sendChat = async (event) => {
    event?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setError('')
    setMessages((m) => [...m, { role: 'user', text }])
    setBusy('chat')
    try {
      const data = await api('/ai/chat', { method: 'POST', body: { leadId, message: text } })
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
          AI Assistant
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
            icon={MessageSquareText}
            label="Draft reply"
            busy={busy === 'reply'}
            onClick={() =>
              run('reply', () =>
                api('/ai/reply', { method: 'POST', body: { leadId, tone: 'professional' } })
              )
            }
          />
          <ActionButton
            icon={Target}
            label="Qualify"
            busy={busy === 'qualify'}
            onClick={() => run('qualify', () => api('/ai/qualify', { method: 'POST', body: { leadId } }))}
          />
          <ActionButton
            icon={CalendarClock}
            label="Timing"
            busy={busy === 'timing'}
            onClick={() => run('timing', () => api('/ai/timing', { method: 'POST', body: { leadId } }))}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
            {error.includes('Gemini API key') && (
              <span className="block text-muted-foreground">
                Add GEMINI_API_KEY to server/.env to enable AI features.
              </span>
            )}
          </p>
        )}

        {result?.type === 'analyze' && <AnalysisView analysis={result.data} />}
        {result?.type === 'reply' && <ReplyView reply={result.data} onCopy={() => copyReply(result.data)} />}

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
      </CardContent>
    </Card>
  )
}