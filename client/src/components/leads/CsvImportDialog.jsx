import { useState } from 'react'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'

function parseCsv(text) {
  const lines = []
  let field = ''
  let inQuotes = false
  let currentLine = []

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(field.trim())
      field = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
      currentLine.push(field.trim())
      if (currentLine.some((f) => f.length > 0)) {
        lines.push(currentLine)
      }
      currentLine = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || currentLine.length > 0) {
    currentLine.push(field.trim())
    if (currentLine.some((f) => f.length > 0)) {
      lines.push(currentLine)
    }
  }

  if (lines.length < 2) return []

  const rawHeaders = lines[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const getIndex = (keys) => rawHeaders.findIndex((h) => keys.some((k) => h.includes(k)))

  const nameIdx = getIndex(['name', 'lead', 'full'])
  const companyIdx = getIndex(['company', 'org', 'business'])
  const emailIdx = getIndex(['email', 'mail'])
  const phoneIdx = getIndex(['phone', 'mobile', 'cell', 'tel'])
  const sourceIdx = getIndex(['source', 'channel'])
  const statusIdx = getIndex(['status', 'stage'])
  const budgetIdx = getIndex(['budget', 'value', 'amount'])
  const reqIdx = getIndex(['requirement', 'need', 'note', 'description'])

  const parsed = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
    const name = nameIdx !== -1 ? row[nameIdx] : row[0]
    if (!name) continue

    parsed.push({
      name,
      company: companyIdx !== -1 ? row[companyIdx] || '' : '',
      email: emailIdx !== -1 ? row[emailIdx] || '' : '',
      phone: phoneIdx !== -1 ? row[phoneIdx] || '' : '',
      source: sourceIdx !== -1 ? row[sourceIdx] || '' : 'CSV Import',
      status: statusIdx !== -1 ? row[statusIdx] || '' : 'New',
      budget: budgetIdx !== -1 ? row[budgetIdx] || '' : '',
      requirement: reqIdx !== -1 ? row[reqIdx] || '' : '',
    })
  }

  return parsed
}

export function CsvImportDialog({ open, onOpenChange, onImported }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result || ''
      const parsed = parseCsv(String(text))
      setPreview(parsed)
    }
    reader.readAsText(selected)
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setLoading(true)
    try {
      const res = await api('/leads/import', {
        method: 'POST',
        body: { leads: preview },
      })
      toast.success(`Imported ${res.importedCount} lead${res.importedCount === 1 ? '' : 's'} successfully!`)
      if (res.skippedCount > 0) {
        toast.info(`Skipped ${res.skippedCount} row${res.skippedCount === 1 ? '' : 's'} with missing names.`)
      }
      setFile(null)
      setPreview([])
      onOpenChange(false)
      onImported?.()
    } catch (err) {
      toast.error(err.message || 'Failed to import CSV')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSample = () => {
    const sampleCsv = `Name,Company,Email,Phone,Source,Status,Budget,Requirement\nJohn Doe,Acme Corp,john@acme.com,+123456789,Website,New,$5000,Needs CRM setup\nJane Smith,Starlight Inc,jane@starlight.io,+987654321,Referral,Qualified,$12000,Looking for sales analytics`
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'sample_leadboard_import.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" /> Import Leads from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with lead details. Headers like Name, Company, Email, Phone, Source, Status, and Budget will be auto-detected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {!file ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center hover:bg-muted/30">
              <Upload className="mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium">Select or drag & drop your CSV file</p>
              <p className="mt-1 text-xs text-muted-foreground">Supported format: .csv (UTF-8)</p>
              <div className="mt-4 flex gap-3">
                <label htmlFor="csv-upload-input">
                  <Button variant="default" size="sm" asChild>
                    <span>Browse CSV</span>
                  </Button>
                  <input
                    id="csv-upload-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                  <Download className="mr-1.5 size-3.5" /> Sample Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                  <span className="truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({preview.length} valid row{preview.length === 1 ? '' : 's'} found)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setFile(null)
                    setPreview([])
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {preview.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>No valid lead rows found in this file. Make sure your CSV contains a "Name" header column.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Previewing first {Math.min(preview.length, 4)} leads:</p>
                  <div className="max-h-48 overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.slice(0, 4).map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium text-xs">{row.name}</TableCell>
                            <TableCell className="text-xs">{row.company || '—'}</TableCell>
                            <TableCell className="text-xs">{row.email || '—'}</TableCell>
                            <TableCell className="text-xs">{row.source || 'CSV Import'}</TableCell>
                            <TableCell className="text-xs">{row.status || 'New'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || preview.length === 0 || loading}
          >
            {loading ? 'Importing...' : `Import ${preview.length} Lead${preview.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
