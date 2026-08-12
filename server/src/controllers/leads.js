import Lead, {
  LEAD_STATUSES,
  LEAD_UPDATE_FIELDS,
  OUTREACH_CHANNELS,
  WEBSITE_STATUSES,
} from '../models/Lead.js'
import FollowUp from '../models/FollowUp.js'
import {
  deleteLeadActivity,
  recordActivity,
} from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { checkFeatureAccess, checkLeadLimit } from '../services/usageService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'name',
  'company',
  'status',
  'budget',
  'source',
  'lastContactedAt',
  'nextFollowUpAt',
]

export const listLeads = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    source,
    websiteStatus,
    outreachChannel,
    industry,
    nextFollowUp,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query
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
      { contactPerson: pattern },
      { website: pattern },
      { industry: pattern },
    ]
  }

  if (status && LEAD_STATUSES.includes(status)) {
    filter.status = status
  }

  if (websiteStatus && WEBSITE_STATUSES.includes(websiteStatus)) {
    filter.websiteStatus = websiteStatus
  }

  if (outreachChannel && OUTREACH_CHANNELS.includes(outreachChannel)) {
    filter.outreachChannel = outreachChannel
  }

  if (industry && typeof industry === 'string' && industry.trim()) {
    filter.industry = new RegExp(escapeRegExp(industry.trim()), 'i')
  }

  if (source && typeof source === 'string' && source.trim()) {
    filter.source = new RegExp(escapeRegExp(source.trim()), 'i')
  }

  if (nextFollowUp) {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (nextFollowUp === 'today') {
      filter.nextFollowUpAt = { $gte: startOfToday, $lte: endOfToday }
    } else if (nextFollowUp === 'overdue') {
      filter.nextFollowUpAt = { $lt: startOfToday }
    } else if (nextFollowUp === 'pending') {
      filter.nextFollowUpAt = { $ne: null }
    }
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
  await checkLeadLimit(req.user.id, 1)

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
  const oldWebStatus = lead.websiteStatus
  const oldChannel = lead.outreachChannel
  const oldNextFollowUp = lead.nextFollowUpAt ? lead.nextFollowUpAt.toISOString() : null

  const changedStatus = oldStatus !== req.body.status && req.body.status !== undefined
  const changedNotes = oldNotes !== req.body.notes && req.body.notes !== undefined
  const changedWebStatus = oldWebStatus !== req.body.websiteStatus && req.body.websiteStatus !== undefined
  const changedChannel = oldChannel !== req.body.outreachChannel && req.body.outreachChannel !== undefined
  const newNextFollowUpStr = req.body.nextFollowUpAt ? new Date(req.body.nextFollowUpAt).toISOString() : null
  const changedNextFollowUp = oldNextFollowUp !== newNextFollowUpStr && req.body.nextFollowUpAt !== undefined

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

  if (changedWebStatus) {
    await recordActivity({
      userId: req.user.id,
      leadId: lead._id,
      type: 'website_status_changed',
      message: `Website status updated ${oldWebStatus} → ${lead.websiteStatus}`,
      metadata: { from: oldWebStatus, to: lead.websiteStatus },
    })
  }

  if (changedChannel) {
    await recordActivity({
      userId: req.user.id,
      leadId: lead._id,
      type: 'outreach_channel_changed',
      message: `Outreach channel updated ${oldChannel} → ${lead.outreachChannel}`,
      metadata: { from: oldChannel, to: lead.outreachChannel },
    })
  }

  if (changedNextFollowUp) {
    await recordActivity({
      userId: req.user.id,
      leadId: lead._id,
      type: 'next_followup_updated',
      message: `Next outreach follow-up set to ${lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : 'None'}`,
      metadata: { nextFollowUpAt: lead.nextFollowUpAt },
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
  await checkFeatureAccess(req.user.id, 'csvExport')

  const leads = await Lead.find({ user: req.user.id }).sort({ createdAt: -1 })

  const headers = [
    'Name',
    'Company',
    'Contact Person',
    'Email',
    'Phone',
    'Website',
    'Website Status',
    'Industry',
    'Outreach Channel',
    'Source',
    'Status',
    'Budget',
    'Requirement',
    'Timeline',
    'Last Contacted At',
    'Next Follow-Up At',
    'Notes',
    'Created At',
  ]

  const rows = leads.map((l) => [
    escapeCsvCell(l.name),
    escapeCsvCell(l.company),
    escapeCsvCell(l.contactPerson),
    escapeCsvCell(l.email),
    escapeCsvCell(l.phone),
    escapeCsvCell(l.website),
    escapeCsvCell(l.websiteStatus),
    escapeCsvCell(l.industry),
    escapeCsvCell(l.outreachChannel),
    escapeCsvCell(l.source),
    escapeCsvCell(l.status),
    escapeCsvCell(l.budget),
    escapeCsvCell(l.requirement),
    escapeCsvCell(l.timeline),
    escapeCsvCell(l.lastContactedAt ? new Date(l.lastContactedAt).toISOString() : ''),
    escapeCsvCell(l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString() : ''),
    escapeCsvCell(l.notes),
    escapeCsvCell(l.createdAt ? new Date(l.createdAt).toISOString() : ''),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"')
  res.status(200).send(csvContent)
})

export const importLeads = asyncHandler(async (req, res) => {
  await checkFeatureAccess(req.user.id, 'csvImport')

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

    const websiteStatus =
      typeof item.websiteStatus === 'string' && WEBSITE_STATUSES.includes(item.websiteStatus.trim())
        ? item.websiteStatus.trim()
        : 'No Website'

    const outreachChannel =
      typeof item.outreachChannel === 'string' && OUTREACH_CHANNELS.includes(item.outreachChannel.trim())
        ? item.outreachChannel.trim()
        : 'Cold Email'

    validLeads.push({
      user: req.user.id,
      name,
      company: typeof item.company === 'string' ? item.company.trim().slice(0, 200) : '',
      contactPerson: typeof item.contactPerson === 'string' ? item.contactPerson.trim().slice(0, 200) : '',
      email: typeof item.email === 'string' ? item.email.trim().toLowerCase().slice(0, 254) : '',
      phone: typeof item.phone === 'string' ? item.phone.trim().slice(0, 50) : '',
      website: typeof item.website === 'string' ? item.website.trim().slice(0, 500) : '',
      industry: typeof item.industry === 'string' ? item.industry.trim().slice(0, 100) : '',
      websiteStatus,
      outreachChannel,
      source: typeof item.source === 'string' ? item.source.trim().slice(0, 100) : 'CSV Import',
      requirement: typeof item.requirement === 'string' ? item.requirement.trim().slice(0, 2000) : '',
      budget: typeof item.budget === 'string' ? item.budget.trim().slice(0, 100) : '',
      timeline: typeof item.timeline === 'string' ? item.timeline.trim().slice(0, 100) : '',
      status,
      lastContactedAt: item.lastContactedAt ? new Date(item.lastContactedAt) : null,
      nextFollowUpAt: item.nextFollowUpAt ? new Date(item.nextFollowUpAt) : null,
      notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 5000) : '',
    })
  }

  if (validLeads.length > 0) {
    await checkLeadLimit(req.user.id, validLeads.length)
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