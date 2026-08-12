import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

const PLANS = [
  {
    name: 'Free Plan',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for solo founders and freelancers getting started with CRM pipeline tracking.',
    popular: false,
    ctaText: 'Start Free',
    ctaLink: '/register',
    features: [
      'Up to 50 active leads in pipeline',
      'Follow-up schedule & notifications',
      'Basic AI lead analysis & replies',
      'Lead search & filterable tables',
      '50 AI requests per month',
      'Standard email support',
    ],
  },
  {
    name: 'Pro Plan',
    price: '$29',
    period: 'per month',
    desc: 'Designed for active agencies and sales teams requiring unlimited leads and advanced AI tools.',
    popular: true,
    ctaText: 'Upgrade to Pro',
    ctaLink: '/register',
    features: [
      'Unlimited leads & pipeline storage',
      'Unlimited AI assistant requests',
      'Full Agency Outreach Workspace',
      'Bulk CSV Import & Export',
      'Action-assisted AI tool execution',
      'Priority support & upcoming team mode',
    ],
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Simple, Transparent Pricing
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Start for free. Scale as you grow.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            No credit card required to start. Every account includes our core pipeline tools.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto text-left">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className={`rounded-[16px] border bg-card p-6 sm:p-8 flex flex-col justify-between relative shadow-lg ${
                plan.popular ? 'border-foreground ring-1 ring-foreground' : 'border-border/80'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-foreground text-background px-3 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="size-3" /> Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 min-h-[36px]">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                  <span className="text-xs text-muted-foreground font-medium">/{plan.period}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-foreground/90 border-t border-border/60 pt-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5">
                      <div className="flex size-4 items-center justify-center rounded-full bg-foreground text-background shrink-0">
                        <Check className="size-2.5" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link to={plan.ctaLink}>
                  <Button
                    size="lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full rounded-full text-xs font-semibold"
                  >
                    {plan.ctaText} <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
