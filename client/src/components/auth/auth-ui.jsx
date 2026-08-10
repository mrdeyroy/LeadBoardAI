import { Sparkles, TrendingUp, ShieldCheck } from 'lucide-react'

const FEATURES = [
  { icon: TrendingUp, text: 'Track leads through a clear status pipeline' },
  { icon: ShieldCheck, text: 'Stay on top of follow-ups — nothing slips' },
  { icon: Sparkles, text: 'AI assists with analysis, replies, and timing' },
]

export function AuthLayoutCard({ title, description, children }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="grid w-full max-w-4xl min-w-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-foreground/10 lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between gap-8 overflow-hidden bg-linear-to-br from-primary via-primary to-primary/95 p-8 text-primary-foreground lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 size-56 rounded-full bg-primary-foreground/10 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
              <Sparkles className="size-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold tracking-tight">LeadBoard AI</span>
              <span className="text-xs text-primary-foreground/70">Lightweight CRM</span>
            </div>
          </div>

          <div className="relative space-y-6">
            <h2 className="text-2xl font-semibold leading-snug tracking-tight">
              Turn leads into customers — without the heavy CRM.
            </h2>
            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary-foreground/80" />
                  <span className="text-sm text-primary-foreground/90">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-primary-foreground/60">
            Your pipeline. Your follow-ups. Your data — all in one place.
          </p>
        </aside>

        <div className="flex w-full min-w-0 items-center justify-center bg-card p-6 sm:p-10">
          <div className="w-full max-w-sm min-w-0">
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
                <Sparkles className="size-5" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}