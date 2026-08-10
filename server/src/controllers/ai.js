import { executeAction } from '../services/actionExecutor.js'
import { aiService } from '../services/aiService.js'
import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

export const analyze = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const analysis = await aiService.analyzeLead(lead)

  await recordActivity({
    userId: req.user.id,
    leadId: lead._id,
    type: 'ai_analysis',
    message: `AI analysis generated (quality: ${analysis.quality})`,
    metadata: { leadId: lead._id.toString(), quality: analysis.quality },
  })

  res.json({ analysis })
})

export const reply = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const replyText = await aiService.generateReply(lead, req.body.tone)
  res.json({ reply: replyText })
})

export const qualify = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const recommendation = await aiService.qualifyLead(lead)
  res.json({ recommendation })
})

export const timing = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const recommendation = await aiService.suggestTiming(lead)
  res.json({ recommendation })
})

export const chat = asyncHandler(async (req, res) => {
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const result = await aiService.chat(lead, req.body.message)
  res.json(result)
})

export const runAction = asyncHandler(async (req, res) => {
  const { tool, params } = req.body ?? {}

  if (typeof tool !== 'string' || !tool) {
    throw new ApiError(400, 'tool is required')
  }
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new ApiError(400, 'params must be an object')
  }

  const result = await executeAction({ tool, params, userId: req.user.id })
  res.json(result)
})