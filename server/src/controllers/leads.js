import Lead, { LEAD_STATUSES, LEAD_UPDATE_FIELDS } from '../models/Lead.js'
import FollowUp from '../models/FollowUp.js'
import {
  deleteLeadActivity,
  recordActivity,
} from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

const ALLOWED_SORT_FIELDS = ['createdAt', 'name', 'company', 'status', 'budget', 'source']

export const listLeads = asyncHandler(async (req, res) => {
  const { search, status, source, sortBy = 'createdAt', sortOrder = 'desc' } = req.query
  const page = parsePositiveInt(req.query.page, 1, 1_000_000)
  const limit = parsePositiveInt(req.query.limit, 20, 100)

  const filter = { user: req.user.id }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search.trim()), 'i')
    filter.$or = [
      { name: pattern },
      { company: pattern },
      { email: pattern },
      { phone: pattern },
      { source: pattern },
    ]
  }

  if (status && LEAD_STATUSES.includes(status)) {
    filter.status = status
  }

  if (source && typeof source === 'string' && source.trim()) {
    filter.source = new RegExp(escapeRegExp(source.trim()), 'i')
  }

  const sortField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt'
  const direction = sortOrder === 'asc' ? 1 : -1
  const sort = { [sortField]: direction }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Lead.countDocuments(filter),
  ])

  res.json({
    leads: leads.map((lead) => lead.toJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})

export const createLead = asyncHandler(async (req, res) => {
  const payload = {}
  for (const field of LEAD_UPDATE_FIELDS) {
    if (req.body[field] !== undefined) payload[field] = req.body[field]
  }

  const lead = await Lead.create({ user: req.user.id, ...payload })

  await recordActivity({
    userId: req.user.id,
    leadId: lead._id,
    type: 'lead_created',
    message: `Lead "${lead.name}" created`,
    metadata: { status: lead.status },
  })

  res.status(201).json({ lead: lead.toJSON() })
})

export const getLead = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.params.id, req.user.id)
  res.json({ lead: lead.toJSON() })
})

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.params.id, req.user.id)

  const oldStatus = lead.status
  const oldNotes = lead.notes
  const changedStatus = oldStatus !== req.body.status && req.body.status !== undefined
  const changedNotes = oldNotes !== req.body.notes && req.body.notes !== undefined

  for (const field of LEAD_UPDATE_FIELDS) {
    if (req.body[field] !== undefined) {
      lead[field] = req.body[field]
    }
  }

  await lead.save()

  if (changedStatus) {
    await recordActivity({
      userId: req.user.id,
      leadId: lead._id,
      type: 'status_changed',
      message: `Status changed ${oldStatus} → ${lead.status}`,
      metadata: { from: oldStatus, to: lead.status },
    })
  }

  if (changedNotes) {
    await recordActivity({
      userId: req.user.id,
      leadId: lead._id,
      type: 'note_added',
      message: 'Note added',
      metadata: { note: lead.notes.slice(0, 200) },
    })
  }

  res.json({ lead: lead.toJSON() })
})

export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.params.id, req.user.id)

  await Promise.all([
    lead.deleteOne(),
    FollowUp.deleteMany({ lead: lead._id }),
    deleteLeadActivity(lead._id),
  ])

  res.json({ message: 'Lead deleted' })
})

function escapeCsvCell(val) {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export const exportLeads = asyncHandler(async (req, res) => {
  const leads = await Lead.find({ user: req.user.id }).sort({ createdAt: -1 })

  const headers = [
    'Name',
    'Company',
    'Email',
    'Phone',
    'Source',
    'Status',
    'Budget',
    'Requirement',
    'Timeline',
    'Notes',
    'Created At',
  ]

  const rows = leads.map((l) => [
    escapeCsvCell(l.name),
    escapeCsvCell(l.company),
    escapeCsvCell(l.email),
    escapeCsvCell(l.phone),
    escapeCsvCell(l.source),
    escapeCsvCell(l.status),
    escapeCsvCell(l.budget),
    escapeCsvCell(l.requirement),
    escapeCsvCell(l.timeline),
    escapeCsvCell(l.notes),
    escapeCsvCell(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"')
  res.status(200).send(csvContent)
})

export const importLeads = asyncHandler(async (req, res) => {
  const rawLeads = Array.isArray(req.body.leads) ? req.body.leads : []

  const validLeads = []
  let skippedCount = 0

  for (const item of rawLeads) {
    if (!item || typeof item !== 'object') {
      skippedCount++
      continue
    }

    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 200) : ''
    if (!name) {
      skippedCount++
      continue
    }

    const status =
      typeof item.status === 'string' && LEAD_STATUSES.includes(item.status.trim())
        ? item.status.trim()
        : 'New'

    validLeads.push({
      user: req.user.id,
      name,
      company: typeof item.company === 'string' ? item.company.trim().slice(0, 200) : '',
      email: typeof item.email === 'string' ? item.email.trim().toLowerCase().slice(0, 254) : '',
      phone: typeof item.phone === 'string' ? item.phone.trim().slice(0, 50) : '',
      source: typeof item.source === 'string' ? item.source.trim().slice(0, 100) : 'CSV Import',
      requirement: typeof item.requirement === 'string' ? item.requirement.trim().slice(0, 2000) : '',
      budget: typeof item.budget === 'string' ? item.budget.trim().slice(0, 100) : '',
      timeline: typeof item.timeline === 'string' ? item.timeline.trim().slice(0, 100) : '',
      status,
      notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 5000) : '',
    })
  }

  if (validLeads.length > 0) {
    const createdDocs = await Lead.insertMany(validLeads)

    const sampleLead = createdDocs[0]
    await recordActivity({
      userId: req.user.id,
      leadId: sampleLead._id,
      type: 'lead_created',
      message: `Imported ${validLeads.length} lead${validLeads.length === 1 ? '' : 's'} via CSV`,
      metadata: { count: validLeads.length },
    })
  }

  res.status(200).json({
    importedCount: validLeads.length,
    skippedCount,
  })
})