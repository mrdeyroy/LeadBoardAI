import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, User, CalendarClock, ShieldCheck } from 'lucide-react'

export function AiSection() {
  const [confirmed, setConfirmed] = useState(false)

  return (
    <section id="ai-assistant" className="py-20 border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-foreground" />
              Action-Assisted AI Engine
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              An AI sales assistant that actually takes action.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              LeadBoard AI is not a generic chatbot. It analyzes lead history, prioritizes your day, drafts outreach replies, and proposes concrete CRM actions—requiring your explicit confirmation before anything touches the database.
            </p>

            <div className="pt-2 space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <ShieldCheck className="size-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">User-Gated Safety Boundary</p>
                  <p className="text-muted-foreground">AI proposes database changes; you confirm with one click.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <CalendarClock className="size-4 text-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Smart Follow-up Timing</p>
                  <p className="text-muted-foreground">Recommends exact dates based on deal heat and outreach history.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Interactive AI Demonstration Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 rounded-[16px] border border-border/80 bg-card p-4 sm:p-6 shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-background font-bold">
                  <Sparkles className="size-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground">AI Sales Assistant Workspace</span>
              </div>
              <span className="rounded-full bg-muted border border-border/80 px-2.5 py-0.5 text-[10px] font-bold text-foreground uppercase tracking-wider">
                Whitelisted Tools Only
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-3.5 text-xs">
              {/* User Prompt */}
              <div className="flex justify-end">
                <div className="flex items-center gap-2 rounded-xl bg-foreground text-background px-3.5 py-2 max-w-[85%] font-medium">
                  <User className="size-3.5 shrink-0 opacity-80" />
                  <span>"Which leads should I follow up with today?"</span>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex justify-start">
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 max-w-[90%] space-y-2 text-foreground">
                  <p className="font-semibold text-foreground">I recommend prioritizing ABC Dental first today.</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    ABC Dental replied to your cold email 2 days ago asking about website redesign pricing. Their status is currently "Replied".
                  </p>
                </div>
              </div>

              {/* AI Proposal Card */}
              <div className="rounded-[12px] border border-border bg-card p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    AI Action Proposal
                  </span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Action Required</span>
                </div>
                <p className="font-semibold text-foreground">Schedule follow-up: "Send proposal & pricing deck to ABC Dental"</p>
                <p className="text-[11px] text-muted-foreground">Due date: Tomorrow (August 14, 2026)</p>

                <div className="pt-1">
                  {confirmed ? (
                    <div className="flex items-center gap-2 rounded-lg bg-foreground text-background p-2 text-xs font-semibold">
                      <Check className="size-4" />
                      <span>Action Confirmed & Executed! Follow-up created in database.</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmed(true)}
                      className="w-full rounded-full bg-foreground text-background px-4 py-2 text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Check className="size-3.5" /> Confirm & Execute Action
                    </button>
                  )}
                </div>
              </div>

              {/* Created Follow-up List Preview */}
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border/80 bg-background p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">Send proposal & pricing deck to ABC Dental</p>
                      <p className="text-[11px] text-muted-foreground">Due Tomorrow · ABC Dental</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-[10px] font-bold">Scheduled</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
