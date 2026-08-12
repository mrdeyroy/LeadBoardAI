import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Inbox,
  PieChart,
  RefreshCw,
  Send,
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

const SOURCE_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(31, 90%, 54%)',
  'hsl(199, 89%, 48%)',
  'hsl(346, 84%, 61%)',
  'hsl(175, 70%, 41%)',
]

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
          <RefreshCw className="mr-1.5 size-4" /> Retry
        </Button>
      </CardContent>
    </Card>
  )
}

function ConversionChartCard({ data, loading }) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" /> Conversion Funnel
        </CardTitle>
        <CardDescription>Leads count by status pipeline stage</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--popover)' }}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={CHART_COLORS[entry.status] || 'var(--primary)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

function SourceAnalyticsCard({ data, loading }) {
  const sources = data || []
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="size-4 text-primary" /> Lead Sources
        </CardTitle>
        <CardDescription>Lead acquisition channel distribution</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : sources.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No lead source data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sources} layout="vertical" margin={{ top: 0, right: 16, left: 16, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
              <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} fontSize={11} width={90} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--popover)' }}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                {sources.map((entry, idx) => (
                  <Cell key={entry.source} fill={SOURCE_COLORS[idx % SOURCE_COLORS.length]} />
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

  const totalLeads = data?.leads?.total ?? 0
  const wonLeads = data?.leads?.won ?? 0
  const winRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0'

  const statCards = [
    { label: 'Total leads', value: data?.leads.total, icon: Users, tone: 'blue' },
    { label: 'New', value: data?.leads.new, icon: Sparkles, tone: 'violet' },
    { label: 'Qualified', value: data?.leads.qualified, icon: CheckCircle2, tone: 'cyan' },
    { label: 'Won', value: data?.leads.won, icon: Trophy, tone: 'emerald' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {greeting(user?.firstName ?? user?.username ?? 'there')}
          </h2>
          <p className="text-sm text-muted-foreground">Here's what's happening across your sales pipeline.</p>
        </div>
        {!loading && totalLeads > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Trophy className="size-3.5" />
            <span>Win Rate: <strong>{winRate}%</strong></span>
          </div>
        )}
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
              <CardContent className="py-8">
                <EmptyState
                  icon={Inbox}
                  title="No leads in pipeline"
                  description="Add your first lead or import from CSV and LeadBoard will start tracking metrics here."
                  action={
                    <Link to="/leads">
                      <Button>
                        Add your first lead <ArrowRight className="ml-1.5 size-4" />
                      </Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Compact Agency Outreach Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="size-4 text-primary" /> Outreach Conversion Summary
                    </CardTitle>
                    <Link to="/outreach" className="text-xs text-muted-foreground hover:text-foreground">
                      Open Outreach Workspace →
                    </Link>
                  </div>
                  <CardDescription>Cold-prospecting funnel from initial contact to won deals</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {loading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 text-center">
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Total Prospects</p>
                        <p className="text-lg font-bold text-foreground">{data?.outreachSummary?.totalProspects ?? 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Contacted</p>
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{data?.outreachSummary?.contacted ?? 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Replied</p>
                        <p className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{data?.outreachSummary?.replied ?? 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Meetings</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data?.outreachSummary?.meetings ?? 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Proposals</p>
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{data?.outreachSummary?.proposals ?? 0}</p>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2.5">
                        <p className="text-[11px] font-medium text-muted-foreground">Won</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data?.outreachSummary?.won ?? 0}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <ConversionChartCard data={data?.statusCounts ?? []} loading={loading} />
                <SourceAnalyticsCard data={data?.sourceCounts ?? []} loading={loading} />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-base">Recent activity</CardTitle>
                      <CardDescription>
                        Latest updates and events recorded across leads
                      </CardDescription>
                    </div>
                    <Link to="/leads" className="text-xs text-muted-foreground hover:text-foreground">
                      View all leads
                    </Link>
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

                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                    <div>
                      <CardTitle className="text-base">Pending follow-ups</CardTitle>
                      <CardDescription>Upcoming reminders</CardDescription>
                    </div>
                    <Link to="/follow-ups" className="text-xs font-medium text-primary hover:underline">
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
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <CheckCircle2 className="mx-auto mb-2 size-6 text-emerald-500/80" />
                        <p className="font-medium">No pending follow-ups</p>
                        <p className="text-xs">You're all caught up!</p>
                      </div>
                    ) : (
                      <ul className="flex flex-col gap-2.5">
                        {data.pendingFollowUps.map((item) => {
                          const isOverdue = new Date(item.dueDate) < new Date()
                          return (
                            <li key={item.id} className="flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors hover:bg-muted/40">
                              <CalendarClock className={`mt-0.5 size-4 shrink-0 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                                <p className="truncate text-[11px] text-muted-foreground">
                                  {item.lead?.name || 'Lead'}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                  isOverdue
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-muted text-muted-foreground'
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
            </>
          )}
        </>
      )}
    </div>
  )
}