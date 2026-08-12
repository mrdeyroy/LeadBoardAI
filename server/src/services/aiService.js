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
import Lead from '../models/Lead.js'
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

  async prioritizeLeads(userId) {
    const leads = await Lead.find({ user: userId, status: { $ne: 'Lost' } })
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean()

    if (leads.length === 0) {
      return { prioritizedLeads: [] }
    }

    const summaries = leads
      .map(
        (l) =>
          `- Lead ID: ${l._id.toString()} | Company: ${l.company || l.name} | Status: ${l.status} | Website: ${l.website || 'None'} | Audit: ${l.websiteStatus || 'None'} | Channel: ${l.outreachChannel || 'Cold Email'} | Last Contacted: ${l.lastContactedAt ? new Date(l.lastContactedAt).toISOString().split('T')[0] : 'Never'} | Next FollowUp: ${l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString().split('T')[0] : 'None'}`
      )
      .join('\n')

    const data = await generateJson(PROMPTS.prioritize, `PROSPECT LIST:\n${summaries}`, 0.2)
    return {
      prioritizedLeads: Array.isArray(data.prioritizedLeads) ? data.prioritizedLeads : [],
    }
  },

  async analyzeLeadFit(lead) {
    const insights = await loadInsights(lead._id)
    const context = buildLeadContext(lead, insights)
    const data = await generateJson(PROMPTS.fitAnalysis, context, 0.2)
    return {
      fitScore: typeof data.fitScore === 'number' ? Math.min(100, Math.max(0, data.fitScore)) : 75,
      fitRating: ['High Fit', 'Medium Fit', 'Low Fit'].includes(data.fitRating) ? data.fitRating : 'Medium Fit',
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      auditOpportunities: Array.isArray(data.auditOpportunities) ? data.auditOpportunities : [],
      recommendedPitch: data.recommendedPitch || '',
    }
  },

  async suggestFollowUpQueue(userId) {
    const [followUps, leads] = await Promise.all([
      FollowUp.find({ user: userId, completed: false })
        .populate('lead', 'name company status website websiteStatus')
        .sort({ dueDate: 1 })
        .limit(10)
        .lean(),
      Lead.find({ user: userId, nextFollowUpAt: { $ne: null } })
        .sort({ nextFollowUpAt: 1 })
        .limit(10)
        .lean(),
    ])

    const textList = followUps
      .map((f) => {
        const leadName = f.lead ? f.lead.company || f.lead.name : 'Unknown Lead'
        const leadId = f.lead ? f.lead._id.toString() : ''
        return `- Lead ID: ${leadId} | Lead Name: ${leadName} | FollowUp Title: ${f.title} | Due: ${new Date(f.dueDate).toISOString().split('T')[0]}`
      })
      .concat(
        leads.map(
          (l) =>
            `- Lead ID: ${l._id.toString()} | Lead Name: ${l.company || l.name} | Status: ${l.status} | Scheduled Next Follow-up: ${new Date(l.nextFollowUpAt).toISOString().split('T')[0]}`
        )
      )
      .join('\n')

    if (!textList.trim()) {
      return { prioritizedFollowUps: [] }
    }

    const data = await generateJson(PROMPTS.followUpAssistant, `PENDING FOLLOW-UPS:\n${textList}`, 0.2)
    return {
      prioritizedFollowUps: Array.isArray(data.prioritizedFollowUps) ? data.prioritizedFollowUps : [],
    }
  },

  async draftOutreach(lead, type = 'first_cold', tone = 'professional') {
    const insights = await loadInsights(lead._id)
    const context = buildLeadContext(lead, insights)
    const data = await generateJson(PROMPTS.draftOutreach(type, tone), context, 0.4)
    return {
      subject: data.subject || `Outreach to ${lead.company || lead.name}`,
      body: data.body || '',
    }
  },

  async generateWeeklySummary(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

    const [activities, statusCounts, leads] = await Promise.all([
      Activity.find({ user: userId, createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Lead.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.find({ user: userId }).sort({ updatedAt: -1 }).limit(10).lean(),
    ])

    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]))

    const contacted = activities.filter(
      (a) => a.type === 'website_status_changed' || a.message.includes('contacted')
    ).length
    const replies = byStatus.Replied || 0
    const meetings = byStatus.Meeting || 0
    const proposals = byStatus.Proposal || 0
    const wins = byStatus.Won || 0

    const statsContext = `
WEEKLY SALES STATS (Past 7 Days):
- Outreach Contacts Logged: ${contacted}
- Replied Leads: ${replies}
- Meetings Scheduled/Held: ${meetings}
- Proposals Active: ${proposals}
- Deals Won: ${wins}

RECENT ACTIVITIES:
${activities.map((a) => `- ${a.message}`).slice(0, 15).join('\n') || 'No recorded activity'}

RECENT PROSPECTS:
${leads.map((l) => `- ${l.company || l.name} (${l.status}, Audit: ${l.websiteStatus || 'None'})`).join('\n')}
`

    const data = await generateJson(PROMPTS.weeklySummary, statsContext, 0.3)

    return {
      outreachCompleted: contacted,
      replies,
      meetings,
      proposals,
      wins,
      summary: data.summary || `Completed outreach touchpoints with ${contacted} prospects this week.`,
      leadsNeedingAttention: Array.isArray(data.leadsNeedingAttention) ? data.leadsNeedingAttention : [],
      suggestedNextActions: Array.isArray(data.suggestedNextActions) ? data.suggestedNextActions : [],
    }
  },
}