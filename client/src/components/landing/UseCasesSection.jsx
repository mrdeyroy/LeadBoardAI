import { motion } from 'framer-motion'
import { Building2, UserCheck, Briefcase, Store, Users2 } from 'lucide-react'

const USE_CASES = [
  {
    icon: Building2,
    title: 'Digital & Creative Agencies',
    desc: 'Audit prospect websites, track cold outreach across email/phone, and convert website redesign leads.',
  },
  {
    icon: UserCheck,
    title: 'Freelancers & Solo Founders',
    desc: 'Eliminate spreadsheet chaos. Keep client requirements, call notes, and follow-up reminders in one clear place.',
  },
  {
    icon: Briefcase,
    title: 'B2B Consultants',
    desc: 'Manage high-ticket advisory leads through discovery calls, proposals, and action-assisted AI follow-ups.',
  },
  {
    icon: Store,
    title: 'Local Businesses & Shops',
    desc: 'Track walk-ins, phone inquiries, and local service leads without getting bogged down in complex enterprise CRMs.',
  },
  {
    icon: Users2,
    title: 'Small Sales Teams (1–5 people)',
    desc: 'Strict user-isolated workspaces where every rep owns their lead pipeline while maintaining unified deal tracking.',
  },
]

export function UseCasesSection() {
  return (
    <section className="py-20 border-b border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl space-y-3"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target Audience & Use Cases
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for teams that sell through relationships.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Designed specifically for high-touch B2B service providers who need pipeline clarity without complexity.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {USE_CASES.map((uc, idx) => {
            const Icon = uc.icon
            return (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="rounded-[14px] border border-border/80 bg-card p-5 space-y-3 shadow-2xs hover:border-border transition-all"
              >
                <div className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{uc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
