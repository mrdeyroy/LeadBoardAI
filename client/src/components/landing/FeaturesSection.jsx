import { motion } from 'framer-motion'
import {
  Users,
  Send,
  CalendarClock,
  ScanSearch,
  MessageSquareText,
  Target,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Lead & Deal Pipeline',
    desc: 'Filterable, sortable, paginated lead management with search and status badges across all deal stages.',
  },
  {
    icon: Send,
    title: 'Agency Outreach Workspace',
    desc: 'Audit prospect website statuses (No Website, Outdated) and execute cold email, phone, or WhatsApp outreach.',
  },
  {
    icon: CalendarClock,
    title: 'Follow-Up Scheduler',
    desc: 'Categorized reminders (Overdue, Due Today, Upcoming, Completed) with automated notification alerts.',
  },
  {
    icon: ScanSearch,
    title: 'AI Lead Analysis',
    desc: 'Instant quality assessment, intent extraction, requirement mining, and recommended next steps.',
  },
  {
    icon: MessageSquareText,
    title: 'AI Outreach Drafting',
    desc: 'Generate editable first-cold, post-call, and follow-up emails tailored by tone (Short, Professional, Friendly).',
  },
  {
    icon: Target,
    title: 'AI Prospect Prioritization',
    desc: 'Score lead fit (0-100) and identify exact agency audit opportunities before hopping on discovery calls.',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Analytics',
    desc: 'Conversion funnel charts, win rate calculations, and lead acquisition source distribution analytics.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Bulk CSV Import & Export',
    desc: 'Seamlessly upload existing prospect CSV spreadsheets with header auto-detection or export full CRM data.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Complete Feature Suite
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your agency needs to close clients.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Built strictly for solo founders and sales teams who sell high-ticket services.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="rounded-[14px] border border-border/80 bg-card p-5 space-y-3 hover:border-border transition-all shadow-2xs"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
