import mongoose from 'mongoose'

import Activity, { ACTIVITY_TYPES } from '../models/Activity.js'
import Lead from '../models/Lead.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toJSON = (doc) => ({
  id: doc._id.toString(),
  type: doc.type,
  message: doc.message,
  metadata:
    doc.metadata instanceof Map ? Object.fromEntries(doc.metadata) : doc.metadata,
  createdAt: doc.createdAt,
  lead: doc.lead ? { id: doc.lead._id.toString(), name: doc.lead.name } : null,
})

export const getLeadActivities = asyncHandler(async (req, res) => {
  const { leadId } = req.params

  if (!mongoose.isValidObjectId(leadId)) {
    throw new ApiError(404, 'Lead not found')
  }
  const lead = await Lead.findOne({ _id: leadId, user: req.user.id }, 'name')
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }

  const filter = { lead: leadId, user: req.user.id }
  const { type } = req.query
  if (type && ACTIVITY_TYPES.includes(type)) {
    filter.type = type
  }

  const activities = await Activity.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('lead', 'name')
    .lean()

  res.json({ activities: activities.map(toJSON) })
})

export const listRecentActivities = asyncHandler(async (req, res) => {
  const { type, search } = req.query
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 100)
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)

  const filter = { user: req.user.id }

  if (type && ACTIVITY_TYPES.includes(type)) {
    filter.type = type
  }

  if (search && typeof search === 'string' && search.trim()) {
    const pattern = new RegExp(escapeRegExp(search.trim()), 'i')
    filter.message = pattern
  }

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('lead', 'name')
      .lean(),
    Activity.countDocuments(filter),
  ])

  res.json({
    activities: activities.map(toJSON),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
})