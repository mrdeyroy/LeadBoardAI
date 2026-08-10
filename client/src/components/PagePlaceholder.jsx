import { Card, CardContent } from '@/components/ui/card'

export function PagePlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Icon className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}