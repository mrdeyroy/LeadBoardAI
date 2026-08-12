import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Percent, CheckCircle2 } from 'lucide-react'

const FUNNEL_METRICS = [
  { stage: 'Total Prospects', count: 124, percent: '100%' },
  { stage: 'Contacted', count: 96, percent: '77.4%' },
  { stage: 'Replies Received', count: 48, percent: '38.7%' },
  { stage: 'Strategy Meetings', count: 24, percent: '19.3%' },
  { stage: 'Proposals Delivered', count: 18, percent: '14.5%' },
  { stage: 'Won Deals', count: 12, percent: '9.6%' },
]

export function AnalyticsSection() {
  return (
    <section className="py-20 border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4 text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Real-Time Pipeline Analytics
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Understand your exact conversion bottlenecks.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Track conversion efficiency across every stage of your pipeline. Instantly calculate win rates, response velocity, and top acquisition channels.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-border/80 bg-card p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                  <TrendingUp className="size-3.5 text-foreground" />
                  Reply Rate
                </div>
                <p className="text-2xl font-bold text-foreground">38.7%</p>
                <p className="text-[10px] text-muted-foreground">Contacted to Replied ratio</p>
              </div>

              <div className="rounded-[12px] border border-border/80 bg-card p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                  <Percent className="size-3.5 text-foreground" />
                  Close Rate
                </div>
                <p className="text-2xl font-bold text-foreground">50.0%</p>
                <p className="text-[10px] text-muted-foreground">Meeting to Proposal close ratio</p>
              </div>
            </div>
          </motion.div>

          {/* Right Visual Funnel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-[16px] border border-border/80 bg-card p-5 sm:p-6 shadow-xl text-left"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <span className="text-xs font-bold text-foreground">Pipeline Conversion Funnel</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-full">
                <Trophy className="size-3" /> Overall Win Rate: 9.6%
              </span>
            </div>

            <div className="space-y-2.5">
              {FUNNEL_METRICS.map((row, idx) => (
                <div key={row.stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-foreground" />
                      {row.stage}
                    </span>
                    <span className="text-muted-foreground">{row.count} ({row.percent})</span>
                  </div>
                  <div className="h-3.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: row.percent }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full rounded-full bg-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
