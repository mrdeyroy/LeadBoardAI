import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-b border-border/40 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3.5 py-1 text-xs font-medium text-foreground shadow-2xs mb-6"
        >
          <Sparkles className="size-3.5 text-foreground" />
          <span>Action-Assisted AI CRM for Solo Founders & Agencies</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]"
        >
          Turn scattered prospects into a <span className="underline decoration-border/80 underline-offset-8">sales pipeline that moves.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          LeadBoard AI helps agencies and founders manage prospects, follow-ups, and agency outreach with an intelligent, action-gated AI assistant.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/register">
            <Button size="lg" className="rounded-full px-6 text-sm font-semibold shadow-md">
              Start Free <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
          <a href="#workflow">
            <Button variant="outline" size="lg" className="rounded-full px-6 text-sm font-medium border-border/80 bg-card hover:bg-muted">
              See How It Works
            </Button>
          </a>
        </motion.div>

        {/* Product Mockup Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 mx-auto max-w-5xl rounded-[16px] border border-border/80 bg-card p-3 sm:p-4 shadow-xl text-left"
        >
          {/* Top Bar Mockup Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3 px-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="size-3 rounded-full bg-border" />
                <span className="size-3 rounded-full bg-border/60" />
                <span className="size-3 rounded-full bg-border/40" />
              </div>
              <span className="ml-2 text-xs font-semibold text-muted-foreground">app.leadboardai.com/dashboard</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-foreground">
                <Trophy className="size-3" /> Win Rate: 42.8%
              </span>
            </div>
          </div>

          {/* Inner Dashboard View Preview */}
          <div className="p-3 sm:p-5 space-y-4">
            {/* KPI Cards row */}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <div className="rounded-[12px] border border-border/80 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Leads</span>
                  <Users className="size-3.5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground mt-1">42</p>
              </div>
              <div className="rounded-[12px] border border-border/80 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Qualified</span>
                  <CheckCircle2 className="size-3.5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground mt-1">18</p>
              </div>
              <div className="rounded-[12px] border border-border/80 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proposals</span>
                  <BarChart3 className="size-3.5 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground mt-1">9</p>
              </div>
              <div className="rounded-[12px] border border-border/80 bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Won Deals</span>
                  <Trophy className="size-3.5 text-foreground" />
                </div>
                <p className="text-lg font-bold text-foreground mt-1">12</p>
              </div>
            </div>

            {/* Split Content Mockup */}
            <div className="grid gap-3 lg:grid-cols-3">
              {/* Left Column - Leads & AI action */}
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-[12px] border border-border/80 bg-background p-3.5">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-foreground">Active Deals</span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">4 Active Prospects</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">Acme Design Co.</p>
                        <p className="text-[11px] text-muted-foreground">Website Redesign · $4,500</p>
                      </div>
                      <span className="rounded-full bg-foreground text-background px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Qualified
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-2.5 text-xs">
                      <div>
                        <p className="font-semibold text-foreground">Nexus Analytics</p>
                        <p className="text-[11px] text-muted-foreground">SEO Retainer · $2,000/mo</p>
                      </div>
                      <span className="rounded-full bg-secondary text-secondary-foreground border border-border/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                        Contacted
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - AI Assistant Proposal Card */}
              <div className="rounded-[12px] border border-border/80 bg-background p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-foreground" />
                  AI Proposal
                </div>
                <div className="rounded-[10px] border border-border bg-card p-2.5 text-xs space-y-2">
                  <p className="font-semibold text-foreground">Schedule follow-up with Acme Design</p>
                  <p className="text-[11px] text-muted-foreground">AI recommends touching base after yesterday's call.</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="rounded-full bg-foreground text-background px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                      <Check className="size-3" /> Confirm & run
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
