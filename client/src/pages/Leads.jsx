import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/EmptyState'
import { CsvImportDialog } from '@/components/leads/CsvImportDialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsync } from '@/hooks/useAsync'
import { api, getSessionToken } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { LEAD_STATUSES } from '@/lib/leads'

const COMMON_SOURCES = [
  'Website',
  'Referral',
  'WhatsApp',
  'Cold Email',
  'Social Media',
  'CSV Import',
  'Event',
]

export default function LeadsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState({ open: false, lead: null })
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const query = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(pageSize),
      page: String(page),
      sortBy,
      sortOrder,
    })
    if (search) params.set('search', search)
    if (status !== 'all') params.set('status', status)
    if (source !== 'all') params.set('source', source)
    return params.toString()
  }, [search, status, source, sortBy, sortOrder, pageSize, page])

  const { data, loading, error, reload } = useAsync(() => api(`/leads?${query}`), [query])

  const openCreate = () => setDialog({ open: true, lead: null })
  const openEdit = (lead) => setDialog({ open: true, lead })

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

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

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const token = await getSessionToken()
      const res = await fetch('/api/leads/export', {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || `Failed to export CSV (${res.status})`)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Leads exported successfully')
    } catch (err) {
      toast.error(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = data?.pagination?.totalPages ?? 0

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-1 size-3 text-muted-foreground/60" />
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 size-3 text-primary" />
    ) : (
      <ArrowDown className="ml-1 size-3 text-primary" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Leads Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            {data && !loading
              ? `${data.pagination.total} total lead${data.pagination.total === 1 ? '' : 's'} in your workspace`
              : 'Manage every lead in one place.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
            <Download className="mr-1.5 size-3.5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-1.5 size-3.5" /> Import CSV
          </Button>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1.5 size-4" /> New lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base">All Leads</CardTitle>
              <CardDescription>Search, filter, sort and manage your deals.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px] sm:w-56">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search leads, companies, phone…"
                  className="w-full pl-8 pr-8"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={source}
                onValueChange={(val) => {
                  setSource(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {COMMON_SOURCES.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
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
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data.leads.length === 0 ? (
            <EmptyState
              icon={Users}
              title={search || status !== 'all' || source !== 'all' ? 'No matching leads' : 'No leads yet'}
              description={
                search || status !== 'all' || source !== 'all'
                  ? 'Try adjusting your search terms or filters.'
                  : 'Create your first lead or import from CSV to populate your CRM.'
              }
              action={
                !search && status === 'all' && source === 'all' ? (
                  <Button onClick={openCreate}>
                    <Plus className="mr-1.5 size-4" /> Add your first lead
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className="cursor-pointer select-none font-semibold hover:text-foreground"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center">
                        Lead {renderSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold hover:text-foreground"
                      onClick={() => toggleSort('source')}
                    >
                      <div className="flex items-center">
                        Source {renderSortIcon('source')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold hover:text-foreground"
                      onClick={() => toggleSort('budget')}
                    >
                      <div className="flex items-center">
                        Budget {renderSortIcon('budget')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold hover:text-foreground"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center">
                        Status {renderSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none font-semibold hover:text-foreground"
                      onClick={() => toggleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Created {renderSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{lead.name}</span>
                          {lead.company && (
                            <span className="text-xs text-muted-foreground">{lead.company}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lead.source ? (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {lead.source}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {lead.budget || '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Lead actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={`/leads/${lead.id}`}>
                                <Eye className="mr-2 size-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(lead)}>
                              <Pencil className="mr-2 size-4" /> Edit Lead
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(lead)}>
                              <Trash2 className="mr-2 size-4" /> Delete Lead
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
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-2">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">
                  Page {page} of {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="size-4" />
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

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={reload}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.name}" and all of its follow-ups and
              activity records.
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