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

export const aiService = {
  async analyzeLead(lead) {
    const data = await generateJson(PROMPTS.analyze, buildLeadContext(lead))
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
    const reply = await generateText(PROMPTS.reply(tone), buildLeadContext(lead))
    if (!reply) {
      throw new ApiError(502, 'AI returned an empty reply')
    }
    return reply
  },

  async qualifyLead(lead) {
    const data = await generateJson(PROMPTS.qualify, buildLeadContext(lead), 0.2)
    return {
      status: data.status ?? lead.status,
      reason: data.reason ?? '',
    }
  },

  async suggestTiming(lead) {
    const data = await generateJson(PROMPTS.timing, buildLeadContext(lead), 0.2)
    const days = Number.parseInt(data.dueInDays, 10)
    return {
      dueInDays: Number.isInteger(days) && days >= 0 ? days : null,
      reason: data.reason ?? '',
    }
  },

  async chat(lead, message) {
    const { parts } = await generateContent({
      systemInstruction: PROMPTS.chat,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${buildLeadContext(lead)}\n\nUser message: ${message || ''}` }],
        },
      ],
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.5 },
    })
    return {
      reply: partsToText(parts).trim(),
      actions: partsToToolCalls(parts),
    }
  },
}