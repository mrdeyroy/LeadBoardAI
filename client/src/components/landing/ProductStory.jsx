import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Send,
  MessageSquare,
  CalendarClock,
  Video,
  FileText,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const containerRef = useRef(null)
  const tabRefs = useRef([])
  const currentStage = STAGES[activeIdx]

  // Auto-play timer: cycle stages every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % STAGES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  // Smoothly slide horizontal tab bar container to center the active pill
  useEffect(() => {
    const container = containerRef.current
    const activeTab = tabRefs.current[activeIdx]
    if (container && activeTab) {
      const containerWidth = container.offsetWidth
      const tabLeft = activeTab.offsetLeft
      const tabWidth = activeTab.offsetWidth
      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      })
    }
  }, [activeIdx])

  const handleSelect = (idx) => {
    setActiveIdx(idx)
    setIsAutoPlaying(false)
  }

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? STAGES.length - 1 : prev - 1))
    setIsAutoPlaying(false)
  }

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % STAGES.length)
    setIsAutoPlaying(false)
  }

  return (
    <section id="workflow" className="py-16 sm:py-20 border-b border-border/40 bg-muted/20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            End-to-End Workflow
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From prospect to closed deal.
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto">
            A structured 7-stage agency sales process that turns cold outreach into predictable revenue.
          </p>
        </motion.div>

        {/* Stage Tabs Navigation */}
        <div className="mt-8 sm:mt-12 relative max-w-4xl mx-auto px-2">
          <div ref={containerRef} className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none snap-x justify-start sm:justify-center">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon
              const isActive = activeIdx === idx
              return (
                <button
                  key={stage.id}
                  ref={(el) => (tabRefs.current[idx] = el)}
                  onClick={() => handleSelect(idx)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold shrink-0 snap-center transition-all ${
                    isActive
                      ? 'bg-foreground text-background shadow-md scale-105'
                      : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{stage.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Stage Card Showcase */}
        <div className="mt-4 sm:mt-6 mx-auto max-w-3xl px-2 sm:px-0">
          <div className="rounded-[16px] border border-border/80 bg-card p-4 sm:p-7 text-left shadow-lg relative overflow-hidden">
            {/* Auto-play progress bar header */}
            {isAutoPlaying && (
              <motion.div
                key={`progress-${activeIdx}`}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute top-0 left-0 h-1 bg-foreground/80"
              />
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3.5 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 sm:size-10 items-center justify-center rounded-full bg-foreground text-background shrink-0 shadow-sm">
                      <currentStage.icon className="size-4 sm:size-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Stage {activeIdx + 1} of 7
                      </span>
                      <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">
                        {currentStage.headline}
                      </h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted border border-border/80 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-foreground shrink-0">
                    {currentStage.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {currentStage.desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Mobile-optimized Card Footer Navigation */}
            <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors py-1 px-1.5 rounded hover:bg-muted"
                aria-label="Previous stage"
              >
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Previous Stage</span>
                <span className="sm:hidden text-[11px]">Prev</span>
              </button>

              {/* Step indicator dots & play/pause toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
                  aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
                >
                  {isAutoPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
                </button>
                <div className="flex items-center gap-1">
                  {STAGES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeIdx ? 'w-4 bg-foreground' : 'w-1.5 bg-border hover:bg-muted-foreground'
                      }`}
                      aria-label={`Go to stage ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 font-semibold text-foreground hover:underline py-1 px-1.5 rounded"
                aria-label="Next stage"
              >
                <span className="hidden sm:inline">Next Stage</span>
                <span className="sm:hidden text-[11px]">Next</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
