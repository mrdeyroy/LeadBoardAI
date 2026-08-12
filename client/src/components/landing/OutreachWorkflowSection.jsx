import { motion } from 'framer-motion'
import { FileSpreadsheet, Sparkles, Send, Target, CalendarClock, Video, Trophy, ArrowRight } from 'lucide-react'

const WORKFLOW_STEPS = [
  { icon: FileSpreadsheet, label: 'CSV Import' },
  { icon: Sparkles, label: 'LeadBoard' },
  { icon: Send, label: 'Outreach' },
  { icon: Target, label: 'AI Prioritize' },
  { icon: CalendarClock, label: 'Follow-up' },
  { icon: Video, label: 'Meeting' },
  { icon: Trophy, label: 'Won Deal' },
]

export function OutreachWorkflowSection() {
  return (
    <section className="py-20 border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agency Prospecting Architecture
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stop managing outreach in spreadsheets.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect raw prospect lists directly to a structured sales pipeline with AI prioritization at every step.
          </p>
        </motion.div>

        {/* Visual Pipeline Bar */}
        <div className="mt-14 overflow-x-auto pb-4">
          <div className="flex items-center justify-start lg:justify-center gap-3 min-w-max px-4">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={step.label} className="flex items-center gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="flex flex-col items-center gap-2 rounded-[14px] border border-border/80 bg-card p-4 w-32 shadow-2xs hover:border-border transition-all"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-bold text-foreground text-center">{step.label}</span>
                  </motion.div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
