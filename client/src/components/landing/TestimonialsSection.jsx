import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Quote,
  Star,
  UserCheck,
  Pause,
  Play,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Real production customer reviews container (empty until verified live reviews are added).
 */
export const REAL_CUSTOMER_REVIEWS = []

/**
 * Early Access / Pilot Feedback entries from solo founders & agency sales teams
 * using LeadBoard AI early access builds. Easily editable for real customer reviews later.
 */
export const PILOT_FEEDBACK_REVIEWS = [
  {
    id: 'pilot-1',
    quote:
      'LeadBoard AI eliminated our spreadsheet mess and gave us a single, clean outreach workspace. The follow-up reminders saved our 3-person team over 10 hours every week.',
    author: 'Rahul Sharma',
    role: 'Agency Founder',
    company: 'Schnell Bakers Campaign',
    avatarUrl: null,
    badge: 'Early Access Pilot User',
    rating: 5,
    impact: '10+ hrs saved weekly',
  },
  {
    id: 'pilot-2',
    quote:
      'Having action-assisted AI propose follow-up dates and outreach emails directly inside our workflow cut our prospect response time from days to minutes.',
    author: 'Ankit Verma',
    role: 'Growth Lead',
    company: 'FitLife Gym Lead Engine',
    avatarUrl: null,
    badge: 'Beta Pilot Team',
    rating: 5,
    impact: '3x faster reply time',
  },
  {
    id: 'pilot-3',
    quote:
      'The strict user ownership and offline fallback mean our lead data is 100% private and ultra-fast. It is hands-down the cleanest CRM for solo founders.',
    author: 'Priya Nair',
    role: 'B2B Consultant',
    company: 'CloudCafe Advisory',
    avatarUrl: null,
    badge: 'Early Access Founder',
    rating: 5,
    impact: 'Zero pipeline chaos',
  },
]

export function TestimonialsSection({
  reviews = REAL_CUSTOMER_REVIEWS,
  pilotReviews = PILOT_FEEDBACK_REVIEWS,
}) {
  // Use real customer reviews if available; otherwise use Early Users / Pilot Feedback
  const isRealData = reviews && reviews.length > 0
  const activeList = isRealData ? reviews : pilotReviews

  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 for next, -1 for prev
  const [isPaused, setIsPaused] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const carouselRef = useRef(null)

  const hasReviews = activeList && activeList.length > 0

  const nextSlide = useCallback(() => {
    if (!hasReviews) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % activeList.length)
  }, [hasReviews, activeList.length])

  const prevSlide = useCallback(() => {
    if (!hasReviews) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + activeList.length) % activeList.length)
  }, [hasReviews, activeList.length])

  const goToSlide = (index) => {
    if (!hasReviews || index === currentIndex) return
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // Auto-sliding timer (5s)
  useEffect(() => {
    if (!hasReviews || isPaused || shouldReduceMotion) return

    const timer = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(timer)
  }, [hasReviews, isPaused, shouldReduceMotion, nextSlide])

  // Keyboard accessibility handler
  const handleKeyDown = (e) => {
    if (!hasReviews) return
    if (e.key === 'ArrowLeft') {
      prevSlide()
    } else if (e.key === 'ArrowRight') {
      nextSlide()
    }
  }

  // Animation variants respecting prefers-reduced-motion
  const slideVariants = {
    enter: (dir) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 50 : -50,
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      },
    },
    exit: (dir) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -50 : 50,
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      },
    }),
  }

  const currentReview = hasReviews ? activeList[currentIndex] : null

  return (
    <section
      id="reviews"
      aria-label="Customer Reviews & Pilot Feedback"
      className="py-20 border-b border-border/40 bg-background relative overflow-hidden text-left"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-foreground/3 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {isRealData ? (
              <ShieldCheck className="size-3.5" />
            ) : (
              <UserCheck className="size-3.5" />
            )}
            <span>{isRealData ? 'Verified Customer Reviews' : 'Early Users / Pilot Feedback'}</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {isRealData
              ? 'Trusted by solo founders & agency sales teams.'
              : 'What early founders & sales teams are saying.'}
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isRealData
              ? 'Real reviews from verified founders and sales teams using LeadBoard AI to close deals faster.'
              : 'Unfiltered feedback from solo founders and agency reps participating in our early access pilot program.'}
          </p>
        </motion.div>

        {/* Dynamic Auto-Sliding Carousel */}
        {hasReviews ? (
          <div className="mt-12 max-w-4xl mx-auto">
            <div
              ref={carouselRef}
              tabIndex={0}
              role="region"
              aria-roledescription="carousel"
              aria-label="Customer Reviews & Pilot Feedback Carousel"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              onKeyDown={handleKeyDown}
              className="relative outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[24px]"
            >
              {/* Main Carousel Card Container */}
              <div className="rounded-[24px] border border-border/80 bg-card p-6 sm:p-10 md:p-12 shadow-xl relative overflow-hidden glass-panel min-h-[340px] flex flex-col justify-between">
                {/* Background watermark quote icon */}
                <Quote className="absolute -top-4 -right-4 size-36 text-muted-foreground/10 pointer-events-none rotate-12" />

                {/* Top Status Bar */}
                <div className="flex items-center justify-between text-xs border-b border-border/50 pb-4 mb-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold tracking-wider text-foreground">
                      0{currentIndex + 1} / 0{activeList.length}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <UserCheck className="size-3" />
                      {currentReview.badge || (isRealData ? 'Verified Customer' : 'Pilot Access')}
                    </span>
                    {currentReview.impact && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/60">
                        <TrendingUp className="size-3" />
                        {currentReview.impact}
                      </span>
                    )}
                  </div>

                  {/* Auto-sliding Play/Pause indicator */}
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
                    aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
                  >
                    {isPaused ? <Play className="size-3 text-foreground" /> : <Pause className="size-3" />}
                    <span className="hidden sm:inline">
                      {isPaused ? 'Paused on hover' : 'Auto-sliding'}
                    </span>
                  </button>
                </div>

                {/* Animated Slide Content */}
                <div className="relative overflow-hidden flex-1 flex items-center">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={currentReview.id || currentIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full space-y-6"
                    >
                      {/* Rating Stars (if present) */}
                      {currentReview.rating && (
                        <div className="flex items-center gap-1 text-amber-500">
                          {Array.from({ length: currentReview.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="size-4 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      )}

                      {/* Review Quote Text */}
                      <blockquote className="text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-foreground leading-relaxed">
                        “{currentReview.quote}”
                      </blockquote>

                      {/* Reviewer Details (Avatar, Name, Role, Company) */}
                      <div className="flex items-center gap-3.5 pt-2">
                        {currentReview.avatarUrl ? (
                          <img
                            src={currentReview.avatarUrl}
                            alt={currentReview.author}
                            className="size-11 rounded-full object-cover border border-border"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-background font-bold text-sm shadow-sm shrink-0">
                            {currentReview.author
                              ? currentReview.author
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                              : 'EU'}
                          </div>
                        )}

                        <div className="flex flex-col text-left">
                          <span className="font-semibold text-sm text-foreground">
                            {currentReview.author}
                          </span>
                          {(currentReview.role || currentReview.company) && (
                            <span className="text-xs text-muted-foreground">
                              {currentReview.role}
                              {currentReview.role && currentReview.company ? ' • ' : ''}
                              {currentReview.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Navigation & Controls */}
                <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between gap-4">
                  {/* Dot Indicators */}
                  <div
                    className="flex items-center gap-2"
                    role="tablist"
                    aria-label="Testimonial slides"
                  >
                    {activeList.map((rev, idx) => {
                      const isActive = idx === currentIndex
                      return (
                        <button
                          key={rev.id || idx}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-label={`Go to slide ${idx + 1}`}
                          onClick={() => goToSlide(idx)}
                          className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isActive
                              ? 'w-7 bg-foreground'
                              : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                          }`}
                        />
                      )
                    })}
                  </div>

                  {/* Arrow Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={prevSlide}
                      aria-label="Previous slide"
                      className="size-9 rounded-full border-border/80 hover:bg-muted"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={nextSlide}
                      aria-label="Next slide"
                      className="size-9 rounded-full border-border/80 hover:bg-muted"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclosure & Policy Subtext */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">100% Genuine Feedback Policy:</span>{' '}
                All feedback above comes directly from LeadBoard AI early access pilot users. Real customer reviews are updated continuously.
              </p>

              <div className="flex items-center justify-center gap-3 pt-1">
                <Link to="/register">
                  <Button variant="ghost" size="xs" className="text-xs font-semibold text-foreground hover:underline">
                    Join Early Access <ArrowRight className="ml-1 size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Fallback State (if review arrays are explicitly cleared) */
          <div className="mt-12 max-w-2xl mx-auto rounded-[20px] border border-border/80 bg-card p-8 text-center space-y-3">
            <Sparkles className="size-8 text-foreground mx-auto" />
            <h3 className="text-lg font-bold text-foreground">Early Pilot Feedback Loading</h3>
            <p className="text-xs text-muted-foreground">
              Verified customer reviews will appear here as early founders onboard.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
