import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Users,
  Send,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Sparkles,
  Trophy,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
} from 'lucide-react'

/**
 * Animated number counter that counts up smoothly when scrolled into view.
 */
function AnimatedNumber({ value, suffix = '', duration = 1.6 }) {
  const [displayValue, setDisplayValue] = useState('0')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  useEffect(() => {
    if (!isInView) return

    // Extract numeric part (e.g. "1,420+" -> 1420)
    const cleanStr = String(value).replace(/,/g, '')
    const numericValue = parseFloat(cleanStr)

    if (isNaN(numericValue)) {
      setDisplayValue(value)
      return
    }

    const isFloat = String(value).includes('.')
    const startTime = performance.now()

    const animateCount = (now) => {
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = numericValue * eased

      if (isFloat) {
        setDisplayValue(current.toFixed(1))
      } else {
        setDisplayValue(Math.floor(current).toLocaleString())
      }

      if (progress < 1) {
        requestAnimationFrame(animateCount)
      } else {
        if (isFloat) {
          setDisplayValue(numericValue.toFixed(1))
        } else {
          setDisplayValue(numericValue.toLocaleString())
        }
      }
    }

    const frameId = requestAnimationFrame(animateCount)
    return () => cancelAnimationFrame(frameId)
  }, [isInView, value, duration])

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  )
}

/**
 * Product usage metrics data with realistic benchmark values.
 * Explicitly labeled as product demo benchmarks.
 */
const METRICS_DATA = [
  {
    id: 'leads-managed',
    title: 'Leads Managed',
    value: 120,
    suffix: '+',
    subtext: 'Active pipeline prospects tracked',
    badge: 'Pipeline Scale',
    icon: Users,
    progress: 75,
    metricTrend: 'Ideal for 1–5 reps',
  },
  {
    id: 'leads-contacted',
    title: 'Leads Contacted',
    value: 85,
    suffix: '',
    subtext: 'Outreach attempts across Email/WhatsApp',
    badge: 'Outreach Pace',
    icon: Send,
    progress: 70,
    metricTrend: '70% active outreach',
  },
  {
    id: 'replies-received',
    title: 'Replies Received',
    value: 28,
    suffix: '',
    subtext: 'Inbound prospect responses',
    badge: 'Engagement',
    icon: MessageSquare,
    progress: 60,
    metricTrend: '32.9% response rate',
  },
  {
    id: 'meetings-booked',
    title: 'Meetings Scheduled',
    value: 12,
    suffix: '',
    subtext: 'Discovery & strategy calls booked',
    badge: 'Qualified Intent',
    icon: Calendar,
    progress: 43,
    metricTrend: '42.8% meeting rate',
  },
  {
    id: 'followups-completed',
    title: 'Follow-ups Completed',
    value: 185,
    suffix: '+',
    subtext: 'Scheduled follow-ups completed on time',
    badge: '95% On-Time',
    icon: CheckCircle2,
    progress: 95,
    metricTrend: 'Zero missed follow-ups',
  },
  {
    id: 'ai-actions',
    title: 'AI Actions Executed',
    value: 420,
    suffix: '+',
    subtext: 'AI lead analyses, drafts & follow-up tools',
    badge: '< 2s Assist',
    icon: Sparkles,
    progress: 84,
    metricTrend: 'Action-assisted AI',
  },
  {
    id: 'conversion-rate',
    title: 'Win Conversion Rate',
    value: 14.2,
    suffix: '%',
    subtext: 'Prospect-to-closed deal ratio',
    badge: 'Deal Velocity',
    icon: Trophy,
    progress: 68,
    metricTrend: 'Early stage benchmark',
  },
]

export function MetricsSection() {
  return (
    <section
      id="metrics"
      className="py-20 border-b border-border/40 bg-muted/20 relative overflow-hidden"
    >
      {/* Background spotlight */}
      <div className="absolute top-0 right-1/4 size-96 bg-foreground/3 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-left">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Activity className="size-3.5 text-foreground" />
            <span>Usage-Driven SaaS Metrics</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Engineered for sales velocity & measurable output.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            LeadBoard AI tracks every prospect interaction, follow-up milestone, and AI assistant task.
            Below are live product benchmark metrics from active demo workflows.
          </p>

          <div className="pt-1 flex justify-center">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider bg-background/80 border border-border/60 px-3 py-0.5 rounded-full">
              [ Product Demo Benchmarks ]
            </span>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {METRICS_DATA.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                className="rounded-[18px] border border-border/80 bg-card p-5 space-y-4 shadow-sm hover:border-border transition-all hover:shadow-md glass-panel flex flex-col justify-between"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background shrink-0 shadow-2xs">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/60">
                    {metric.badge}
                  </span>
                </div>

                {/* Main Metric Value */}
                <div className="space-y-1 pt-1">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-baseline gap-0.5">
                    <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                  </div>
                  <h3 className="text-xs font-bold text-foreground">{metric.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">{metric.subtext}</p>
                </div>

                {/* Progress Bar & Trend Indicator */}
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="size-3 text-foreground" />
                      {metric.metricTrend}
                    </span>
                    <span className="text-foreground font-mono">{metric.progress}%</span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${metric.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.2 + idx * 0.05 }}
                      className="h-full rounded-full bg-foreground"
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 rounded-[14px] border border-border/60 bg-card/60 p-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-foreground shrink-0" />
            <span>
              All values above demonstrate synthetic demo benchmark metrics generated across standard LeadBoard AI workflows.
            </span>
          </div>
          <span className="font-semibold text-foreground shrink-0 border-l border-border/60 pl-3 hidden sm:inline">
            Real-time pipeline tracking
          </span>
        </motion.div>
      </div>
    </section>
  )
}
