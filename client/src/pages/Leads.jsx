import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { LeadDialog } from '@/components/leads/LeadDialog'
import { StatusBadge } from '@/components/leads/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsync } from '@/hooks/useAsync'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES } from '@/lib/leads'

const PAGE_SIZE = 12

export default function LeadsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState({ open: false, lead: null })
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) })
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    return params.toString()
  }, [search, status, page])

  const { data, loading, error, reload } = useAsync(() => api(`/leads?${query}`), [query])

  const openCreate = () => setDialog({ open: true, lead: null })
  const openEdit = (lead) => setDialog({ open: true, lead })

  const handleDelete = async () => {
    try {
      await api(`/leads/${deleteTarget.id}`, { method: 'DELETE' })
      toast.success('Lead deleted')
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const totalPages = data?.pagination?.totalPages ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {data && !loading
              ? `${data.pagination.total} lead${data.pagination.total === 1 ? '' : 's'} in your pipeline`
              : 'Manage every lead in one place.'}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> New lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Pipeline</CardTitle>
              <CardDescription>Search, filter and manage your leads.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads…"
                  className="w-full pl-8 sm:w-56"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-10 text-center text-sm text-destructive">{error.message}</p>
          ) : loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : data.leads.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search || status !== 'all' ? 'No matching leads' : 'No leads yet'}
              description={
                search || status !== 'all'
                  ? 'Try a different search or clear the filters.'
                  : 'Create your first lead to start building your pipeline.'
              }
              action={
                !search && status === 'all' ? (
                  <Button onClick={openCreate}>
                    <Plus /> Add your first lead
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.name}</span>
                          {lead.company && (
                            <span className="text-xs text-muted-foreground">{lead.company}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{lead.source || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.budget || '—'}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Lead actions">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={`/leads/${lead.id}`}>
                                <Eye /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(lead)}>
                              <Pencil /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(lead)}>
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && data?.leads.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages || 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
        lead={dialog.lead}
        onSaved={reload}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.name}" and all of its follow-ups and
              activity. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}