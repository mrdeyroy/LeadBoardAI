import { Badge } from '@/components/ui/badge'
import { STATUS_STYLES } from '@/lib/leads'

export function StatusBadge({ status }) {
  const className = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
  return (
    <Badge className={`border-transparent ${className}`}>
      {status}
    </Badge>
  )
}