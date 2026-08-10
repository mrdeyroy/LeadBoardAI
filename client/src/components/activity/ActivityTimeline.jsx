import {
  ArrowLeftRight,
  BrainCircuit,
  CalendarClock,
  Plus,
  StickyNote,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/format'

const ACTIVITY_META = {
  lead_created: { icon: Plus, tone: 'bg-blue-100 text-blue-600' },
  status_changed: { icon: ArrowLeftRight, tone: 'bg-violet-100 text-violet-600' },
  note_added: { icon: StickyNote, tone: 'bg-amber-100 text-amber-600' },
  ai_analysis: { icon: BrainCircuit, tone: 'bg-cyan-100 text-cyan-600' },
  followup_created: { icon: CalendarClock, tone: 'bg-emerald-100 text-emerald-600' },
  ai_action: { icon: Zap, tone: 'bg-cyan-100 text-cyan-600' },
}

const EMPTY_META = { icon: Zap, tone: 'bg-muted text-muted-foreground' }

function ActivityRow({ activity, showLead }) {
  const { icon: Icon, tone } = ACTIVITY_META[activity.type] ?? EMPTY_META
  return (
    <li className="flex gap-3">
      <div className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full', tone)}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{activity.message}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {showLead && activity.lead?.name ? `${activity.lead.name} · ` : ''}
          {timeAgo(activity.createdAt)}
        </p>
      </div>
    </li>
  )
}

export function ActivityTimeline({ activities, showLead = true, limit }) {
  const items = limit ? activities.slice(0, limit) : activities
  if (items.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No activity yet.</p>
  }
  return (
    <ol className="flex flex-col gap-4 py-1">
      {items.map((activity) => (
        <ActivityRow key={activity.id} activity={activity} showLead={showLead} />
      ))}
    </ol>
  )
}