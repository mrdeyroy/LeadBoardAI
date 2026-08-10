import mongoose from 'mongoose'

import Activity from '../models/Activity.js'
import Lead from '../models/Lead.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

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

  const activities = await Activity.find({ lead: leadId, user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('lead', 'name')
    .lean()

  res.json({ activities: activities.map(toJSON) })
})

export const listRecentActivities = asyncHandler(async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 50)

  const activities = await Activity.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('lead', 'name')
    .lean()

  res.json({ activities: activities.map(toJSON) })
})