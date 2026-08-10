import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Inbox,
  RefreshCw,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ActivityTimeline } from '@/components/activity/ActivityTimeline'
import { StatCard } from '@/components/dashboard/StatCard'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@clerk/clerk-react'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { CHART_COLORS } from '@/lib/leads'

function greeting(name) {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 18) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

function ErrorCard({ error, onRetry }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 py-6">
        <div>
          <p className="font-medium">Couldn't load your dashboard</p>
          <p className="text-sm text-muted-foreground">{error?.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Retry
        </Button>
      </CardContent>
    </Card>
  )
}

function ChartCard({ data, loading }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Conversion funnel</CardTitle>
        <CardDescription>Leads by status</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={CHART_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useUser()
  const { data, loading, error, reload } = useAsync(() => api('/dashboard'), [])

  const statCards = [
    { label: 'Total leads', value: data?.leads.total, icon: Users, tone: 'blue' },
    { label: 'New', value: data?.leads.new, icon: Sparkles, tone: 'violet' },
    { label: 'Qualified', value: data?.leads.qualified, icon: CheckCircle2, tone: 'cyan' },
    { label: 'Won', value: data?.leads.won, icon: Trophy, tone: 'emerald' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {greeting(user?.firstName ?? user?.username ?? 'there')}
        </h2>
        <p className="text-sm text-muted-foreground">Here's what's happening with your leads.</p>
      </div>

      {error ? (
        <ErrorCard error={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} loading={loading} />
            ))}
          </div>

          {!loading && data?.leads.total === 0 ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Inbox}
                  title="No leads yet"
                  description="Add your first lead and LeadBoard will start tracking it here."
                  action={
                    <Link to="/leads">
                      <Button>
                        Add your first lead <ArrowRight />
                      </Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ChartCard data={data?.statusCounts ?? []} loading={loading} />
              </div>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Pending follow-ups</CardTitle>
                    <CardDescription>Upcoming reminders</CardDescription>
                  </div>
                  <Link to="/follow-ups" className="text-sm text-muted-foreground hover:text-foreground">
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : data?.pendingFollowUps.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">
                      Nothing pending. Nice.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {data.pendingFollowUps.map((item) => {
                        const overdue = new Date(item.dueDate) < new Date()
                        return (
                          <li key={item.id} className="flex items-center gap-3">
                            <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.lead?.name}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-xs ${
                                overdue ? 'font-medium text-destructive' : 'text-muted-foreground'
                              }`}
                            >
                              {formatDate(item.dueDate)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>
                Latest changes across your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <ActivityTimeline activities={data?.recentActivity ?? []} limit={8} />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}