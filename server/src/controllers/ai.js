import { executeAction } from '../services/actionExecutor.js'
import { aiService } from '../services/aiService.js'
import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { checkAIUsage, incrementAIUsage } from '../services/usageService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

export const analyze = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const analysis = await aiService.analyzeLead(lead)
  await incrementAIUsage(req.user.id)

  await recordActivity({
    userId: req.user.id,
    leadId: lead._id,
    type: 'ai_analysis',
    message: `AI analysis generated (quality: ${analysis.quality})`,
    metadata: { leadId: lead._id.toString(), quality: analysis.quality, actor: 'ai' },
  })

  res.json({ analysis })
})

export const reply = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const replyText = await aiService.generateReply(lead, req.body.tone)
  await incrementAIUsage(req.user.id)
  res.json({ reply: replyText })
})

export const qualify = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const recommendation = await aiService.qualifyLead(lead)
  await incrementAIUsage(req.user.id)
  res.json({ recommendation })
})

export const timing = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const recommendation = await aiService.suggestTiming(lead)
  await incrementAIUsage(req.user.id)
  res.json({ recommendation })
})

export const chat = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const history = sanitizeHistory(req.body.history)
  const result = await aiService.chat(lead, req.body.message, history)
  await incrementAIUsage(req.user.id)
  res.json(result)
})

function sanitizeHistory(history) {
  if (history === undefined || history === null) return []
  if (!Array.isArray(history)) throw new ApiError(400, 'history must be an array')
  if (history.length > 12) return sanitizeHistory(history.slice(-12))

  const clean = []
  for (const item of history) {
    if (!item || typeof item !== 'object') throw new ApiError(400, 'invalid history item')
    const role = item.role === 'user' ? 'user' : item.role === 'assistant' ? 'assistant' : null
    const text = typeof item.text === 'string' ? item.text.trim() : ''
    if (!role || !text) throw new ApiError(400, 'history items need a valid role and text')
    if (text.length > 5000) throw new ApiError(400, 'history text is too long')
    clean.push({ role, text })
  }
  return clean
}

export const runAction = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
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

export const prioritize = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const result = await aiService.prioritizeLeads(req.user.id)
  await incrementAIUsage(req.user.id)
  res.json(result)
})

export const fitAnalysis = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const fit = await aiService.analyzeLeadFit(lead)
  await incrementAIUsage(req.user.id)
  res.json({ fit })
})

export const followupAssistant = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const result = await aiService.suggestFollowUpQueue(req.user.id)
  await incrementAIUsage(req.user.id)
  res.json(result)
})

export const draftOutreach = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const lead = await findOwnedLead(req.body.leadId, req.user.id)
  const type = ['first_cold', 'follow_up', 'post_call'].includes(req.body.type) ? req.body.type : 'first_cold'
  const draft = await aiService.draftOutreach(lead, type, req.body.tone)
  await incrementAIUsage(req.user.id)
  res.json(draft)
})

export const weeklySummary = asyncHandler(async (req, res) => {
  await checkAIUsage(req.user.id)
  const summary = await aiService.generateWeeklySummary(req.user.id)
  await incrementAIUsage(req.user.id)
  res.json(summary)
})