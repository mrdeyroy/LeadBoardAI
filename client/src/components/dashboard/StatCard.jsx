import { LoaderCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const ICON_TONES = {
  default: 'bg-primary/10 text-primary',
  blue: 'bg-blue-100 text-blue-600',
  violet: 'bg-violet-100 text-violet-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
}

export function StatCard({ label, value, icon: Icon, tone = 'default', loading }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', ICON_TONES[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <LoaderCircle className="mt-1 size-4 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}