import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileSpreadsheet,
  Sparkles,
  Send,
  Target,
  CalendarClock,
  Video,
  Trophy,
  ArrowRight,
} from 'lucide-react'

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
  const [activeIdx, setActiveIdx] = useState(0)

  // Subtle auto-highlight pulse animation cycling through steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % WORKFLOW_STEPS.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="py-16 sm:py-20 border-b border-border/40 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agency Prospecting Architecture
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Stop managing outreach in spreadsheets.
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto">
            Connect raw prospect lists directly to a structured sales pipeline with AI prioritization at every step.
          </p>
        </motion.div>

        {/* Visual Pipeline Bar - Perfectly responsive on Desktop (no cropping) and Mobile */}
        <div className="mt-10 sm:mt-14 w-full max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-start md:justify-between gap-1.5 sm:gap-2 lg:gap-3 overflow-x-auto md:overflow-x-visible pb-4 pt-2 px-3 scrollbar-none snap-x">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon
              const isActive = activeIdx === idx
              return (
                <div key={step.label} className="flex items-center gap-1.5 sm:gap-2 shrink-0 snap-center md:flex-1 md:min-w-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -3, scale: 1.03 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                    onClick={() => setActiveIdx(idx)}
                    className={`flex flex-col items-center gap-2 rounded-[14px] border p-3 sm:p-3.5 w-24 sm:w-28 md:w-full max-w-[125px] cursor-pointer transition-all duration-300 ${
                      isActive
                        ? 'border-foreground bg-card shadow-md ring-2 ring-foreground/20 -translate-y-1'
                        : 'border-border/80 bg-card/60 text-muted-foreground hover:text-foreground hover:border-border'
                    }`}
                  >
                    <div
                      className={`flex size-8 sm:size-9 items-center justify-center rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-foreground text-background shadow-sm scale-110'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <span
                      className={`text-[11px] sm:text-xs font-bold text-center leading-tight transition-colors duration-300 ${
                        isActive ? 'text-foreground font-extrabold' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="size-3.5 sm:size-4 text-muted-foreground/50 shrink-0 hidden sm:block md:block" />
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


