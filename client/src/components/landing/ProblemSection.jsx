import { motion } from 'framer-motion'
import {
  ArrowRight,
  FileSpreadsheet,
  MessageSquare,
  StickyNote,
  Clock,
  Sparkles,
} from 'lucide-react'

const SCATTERED_TOOLS = [
  {
    icon: FileSpreadsheet,
    title: 'Spreadsheets',
    desc: 'Leads lost in column AE row 412',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Chats',
    desc: 'Prospect messages buried under group chats',
  },
  {
    icon: StickyNote,
    title: 'Sticky Notes',
    desc: 'Call requirements forgotten overnight',
  },
  {
    icon: Clock,
    title: 'Manual Reminders',
    desc: 'Follow-ups missed because calendar alerts were skipped',
  },
]

export function ProblemSection() {
  return (
    <section id="problem" className="py-20 border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            The Problem
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your sales workflow shouldn&apos;t live in five different places.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            When you manage agency prospects across random tools, deal context is lost, follow-ups fall through the cracks, and revenue leaks out.
          </p>
        </motion.div>

        {/* Comparison grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-12 items-center">
          {/* Scattered Tools Column */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {SCATTERED_TOOLS.map((tool, idx) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="rounded-[12px] border border-border/80 bg-card p-4 space-y-2 opacity-85 hover:opacity-100 transition-opacity"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <tool.icon className="size-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground">{tool.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{tool.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Center Connector */}
          <div className="lg:col-span-2 flex justify-center py-4 lg:py-0">
            <div className="flex size-10 items-center justify-center rounded-full border border-border/80 bg-muted text-foreground">
              <ArrowRight className="size-4 rotate-90 lg:rotate-0" />
            </div>
          </div>

          {/* Unified Solution Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 rounded-[16px] border border-border/80 bg-foreground text-background p-6 text-left space-y-4 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-background text-foreground font-bold">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">LeadBoard AI Unified Engine</h3>
                <p className="text-xs text-background/70 font-medium">Single source of sales truth</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-background/90 pt-2">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-background shrink-0" />
                <span>Centralized deal pipeline & auto-recorded activities</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-background shrink-0" />
                <span>Scheduled follow-up reminders with overdue alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-background shrink-0" />
                <span>Action-assisted AI assistant for drafting & qualifying</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-background shrink-0" />
                <span>Outreach workspace & CSV import/export</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
