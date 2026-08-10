import {
  generateContent,
  partsToText,
  partsToToolCalls,
} from './geminiService.js'
import {
  buildLeadContext,
  PROMPTS,
  TOOL_DECLARATIONS,
} from './prompts.js'
import { ApiError } from '../utils/ApiError.js'
import FollowUp from '../models/FollowUp.js'
import Activity from '../models/Activity.js'

const JSON_CONFIG = { temperature: 0.3, responseMimeType: 'application/json' }

function parseObject(text) {
  const cleaned = text.trim().replace(/^```(?:json)?/, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    throw new ApiError(502, 'AI returned an unreadable response')
  }
}

async function generateJson(systemInstruction, leadText, temperature = 0.3) {
  const { parts } = await generateContent({
    systemInstruction,
    contents: [{ role: 'user', parts: [{ text: leadText }] }],
    generationConfig: { ...JSON_CONFIG, temperature },
  })
  return parseObject(partsToText(parts))
}

async function generateText(systemInstruction, leadText, message = '', temperature = 0.6) {
  const { parts } = await generateContent({
    systemInstruction,
    contents: [{ role: 'user', parts: [{ text: message ? `${leadText}\n\nUser message: ${message}` : leadText }] }],
    generationConfig: { temperature },
  })
  return partsToText(parts).trim()
}

async function loadInsights(leadId) {
  const [followUps, activities] = await Promise.all([
    FollowUp.find({ lead: leadId, completed: false })
      .sort({ dueDate: 1 })
      .limit(3)
      .select('title dueDate completed')
      .lean(),
    Activity.find({ lead: leadId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('message type')
      .lean(),
  ])

  return {
    followUps: followUps.map((f) => ({
      title: f.title,
      dueDate: f.dueDate,
    })),
    activities: activities.map((a) => ({ message: a.message, type: a.type })),
  }
}

export const aiService = {
  async analyzeLead(lead) {
    const insights = await loadInsights(lead._id)
    const data = await generateJson(PROMPTS.analyze, buildLeadContext(lead, insights))
    return {
      summary: data.summary ?? '',
      quality: ['High', 'Medium', 'Low'].includes(data.quality) ? data.quality : 'Medium',
      intent: data.intent ?? '',
      requirements: Array.isArray(data.requirements) ? data.requirements : [],
      missingInformation: Array.isArray(data.missingInformation) ? data.missingInformation : [],
      recommendedNextAction: data.recommendedNextAction ?? '',
    }
  },

  async generateReply(lead, tone = 'professional') {
    const insights = await loadInsights(lead._id)
    const reply = await generateText(PROMPTS.reply(tone), buildLeadContext(lead, insights))
    if (!reply) {
      throw new ApiError(502, 'AI returned an empty reply')
    }
    return reply
  },

  async qualifyLead(lead) {
    const insights = await loadInsights(lead._id)
    const data = await generateJson(PROMPTS.qualify, buildLeadContext(lead, insights), 0.2)
    return {
      status: data.status ?? lead.status,
      reason: data.reason ?? '',
    }
  },

  async suggestTiming(lead) {
    const insights = await loadInsights(lead._id)
    const data = await generateJson(PROMPTS.timing, buildLeadContext(lead, insights), 0.2)
    const days = Number.parseInt(data.dueInDays, 10)
    return {
      dueInDays: Number.isInteger(days) && days >= 0 && days <= 14 ? days : null,
      reason: data.reason ?? '',
      title: data.title ?? '',
    }
  },

  async chat(lead, message, history = []) {
    const insights = await loadInsights(lead._id)
    const contents = [
      ...history.map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: item.text }],
      })),
      {
        role: 'user',
        parts: [{ text: `${buildLeadContext(lead, insights)}\n\nUser message: ${message || ''}` }],
      },
    ]

    const { parts } = await generateContent({
      systemInstruction: PROMPTS.chat,
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.5 },
    })
    return {
      reply: partsToText(parts).trim(),
      actions: partsToToolCalls(parts),
    }
  },
}