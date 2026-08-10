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

export const listLeads = asyncHandler(async (req, res) => {
  const { search, status } = req.query
  const page = parsePositiveInt(req.query.page, 1, 1_000_000)
  const limit = parsePositiveInt(req.query.limit, 20, 50)

  const filter = { user: req.user.id }

  if (search) {
    const pattern = new RegExp(escapeRegExp(search.trim()), 'i')
    filter.$or = [
      { name: pattern },
      { company: pattern },
      { email: pattern },
      { phone: pattern },
    ]
  }

  if (status && LEAD_STATUSES.includes(status)) {
    filter.status = status
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
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