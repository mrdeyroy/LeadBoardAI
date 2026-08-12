import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Send,
  MessageSquare,
  CalendarClock,
  Video,
  FileText,
  Trophy,
  CheckCircle2,
} from 'lucide-react'

const STAGES = [
  {
    id: 'research',
    title: '1. Research',
    icon: Search,
    headline: 'Identify target accounts & website gaps',
    desc: 'Audit prospect websites, evaluate redesign opportunities, and record initial agency notes in one place.',
    badge: 'No Website / Outdated',
  },
  {
    id: 'outreach',
    title: '2. Outreach',
    icon: Send,
    headline: 'Execute cold email & phone touchpoints',
    desc: 'Select preferred outreach channels (Cold Email, Phone, WhatsApp) and track exact last-contacted dates.',
    badge: 'Contacted Stage',
  },
  {
    id: 'reply',
    title: '3. Reply',
    icon: MessageSquare,
    headline: 'Capture prospect responses instantly',
    desc: 'When a prospect replies, log their key pain points and use AI to draft a tailored, high-converting response.',
    badge: 'Replied Stage',
  },
  {
    id: 'followup',
    title: '4. Follow-up',
    icon: CalendarClock,
    headline: 'Never lose a warm conversation',
    desc: 'Automated follow-up reminders ensure you touch base on time with zero manual memory burden.',
    badge: 'Scheduled Reminder',
  },
  {
    id: 'meeting',
    title: '5. Meeting',
    icon: Video,
    headline: 'Conduct discovery & demo calls',
    desc: 'Convert interest into scheduled strategy calls with clear requirements and budget parameters.',
    badge: 'Meeting Booked',
  },
  {
    id: 'proposal',
    title: '6. Proposal',
    icon: FileText,
    headline: 'Deliver scope & pricing proposals',
    desc: 'Move deal status to Proposal, lock in timeline commitments, and track decision-maker feedback.',
    badge: 'Proposal Out',
  },
  {
    id: 'won',
    title: '7. Won Deal',
    icon: Trophy,
    headline: 'Close the client & measure win rate',
    desc: 'Celebrate closed revenue. Your dashboard updates pipeline conversion stats automatically.',
    badge: 'Won Deal',
  },
]

export function ProductStory() {
  const [activeIdx, setActiveIdx] = useState(0)
  const currentStage = STAGES[activeIdx]

  return (
    <section id="workflow" className="py-20 border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            End-to-End Workflow
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From prospect to closed deal.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            A structured 7-stage agency sales process that turns cold outreach into predictable revenue.
          </p>
        </motion.div>

        {/* Stage Tabs Navigation */}
        <div className="mt-12 flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon
            const isActive = activeIdx === idx
            return (
              <button
                key={stage.id}
                onClick={() => setActiveIdx(idx)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? 'bg-foreground text-background shadow-md'
                    : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="size-3.5" />
                <span>{stage.title}</span>
              </button>
            )
          })}
        </div>

        {/* Active Stage Card Showcase */}
        <motion.div
          key={currentStage.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 mx-auto max-w-3xl rounded-[16px] border border-border/80 bg-card p-6 sm:p-8 text-left shadow-lg"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
                <currentStage.icon className="size-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stage {activeIdx + 1} of 7</span>
                <h3 className="text-lg font-bold text-foreground">{currentStage.headline}</h3>
              </div>
            </div>
            <span className="rounded-full bg-muted border border-border/80 px-3 py-1 text-xs font-bold text-foreground shrink-0">
              {currentStage.badge}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStage.desc}
          </p>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60 text-xs">
            <button
              disabled={activeIdx === 0}
              onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
              className="text-muted-foreground hover:text-foreground disabled:opacity-40 font-medium"
            >
              ← Previous Stage
            </button>

            <div className="flex gap-1.5">
              {STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`size-2 rounded-full ${i === activeIdx ? 'bg-foreground' : 'bg-border'}`}
                />
              ))}
            </div>

            <button
              disabled={activeIdx === STAGES.length - 1}
              onClick={() => setActiveIdx((prev) => Math.min(STAGES.length - 1, prev + 1))}
              className="font-semibold text-foreground hover:underline disabled:opacity-40 flex items-center gap-1"
            >
              Next Stage <CheckCircle2 className="size-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
