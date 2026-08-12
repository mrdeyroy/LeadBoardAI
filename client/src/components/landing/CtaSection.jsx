import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="py-20 border-b border-border/40 bg-foreground text-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3.5 py-1 text-xs font-medium text-background mb-2">
            <Sparkles className="size-3.5" />
            <span>Ready to transform your sales pipeline?</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Your next client shouldn&apos;t get lost in a spreadsheet.
          </h2>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-background/80 leading-relaxed">
            Join agencies and founders who use LeadBoard AI to manage deals, automate follow-ups, and convert outreach into closed clients.
          </p>

          <div className="pt-4 flex justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="rounded-full px-8 text-sm font-bold text-foreground bg-background hover:bg-background/90 shadow-lg">
                Start using LeadBoard <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
