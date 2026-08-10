import mongoose from 'mongoose'

import FollowUp from '../models/FollowUp.js'
import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

async function findOwnedFollowUp(followUpId, userId) {
  if (!mongoose.isValidObjectId(followUpId)) {
    throw new ApiError(404, 'Follow-up not found')
  }
  const followUp = await FollowUp.findOne({ _id: followUpId, user: userId })
  if (!followUp) {
    throw new ApiError(404, 'Follow-up not found')
  }
  return followUp
}

export const listFollowUps = asyncHandler(async (req, res) => {
  const openOnly = req.query.openOnly === 'true'
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 50, 100)

  const filter = { user: req.user.id }
  if (openOnly) filter.completed = false

  const followUps = await FollowUp.find(filter)
    .sort({ completed: 1, dueDate: 1 })
    .limit(limit)
    .populate('lead', 'name')
    .lean()

  res.json({
    followUps: followUps.map((f) => ({
      id: f._id.toString(),
      title: f.title,
      dueDate: f.dueDate,
      completed: f.completed,
      createdAt: f.createdAt,
      lead: f.lead ? { id: f.lead._id.toString(), name: f.lead.name } : null,
    })),
  })
})

export const createFollowUp = asyncHandler(async (req, res) => {
  const { leadId, title, dueDate } = req.body

  const lead = await findOwnedLead(leadId, req.user.id)

  const followUp = await FollowUp.create({
    user: req.user.id,
    lead: leadId,
    title,
    dueDate: new Date(dueDate),
  })

  await recordActivity({
    userId: req.user.id,
    leadId: lead._id,
    type: 'followup_created',
    message: `Follow-up scheduled: ${title}`,
    metadata: { title, dueDate: followUp.dueDate.toISOString() },
  })

  res.status(201).json({ followUp: followUp.toJSON() })
})

export const updateFollowUp = asyncHandler(async (req, res) => {
  const followUp = await findOwnedFollowUp(req.params.id, req.user.id)

  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
      throw new ApiError(400, 'Title is required')
    }
    followUp.title = req.body.title.trim().slice(0, 200)
  }

  if (req.body.dueDate !== undefined) {
    const d = new Date(req.body.dueDate)
    if (Number.isNaN(d.getTime())) {
      throw new ApiError(400, 'Invalid due date')
    }
    followUp.dueDate = d
  }

  if (req.body.completed !== undefined) {
    followUp.completed = Boolean(req.body.completed)
  }

  await followUp.save()
  res.json({ followUp: followUp.toJSON() })
})

export const deleteFollowUp = asyncHandler(async (req, res) => {
  const followUp = await findOwnedFollowUp(req.params.id, req.user.id)
  await followUp.deleteOne()
  res.json({ message: 'Follow-up deleted' })
})