import FollowUp from '../models/FollowUp.js'
import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { ApiError } from '../utils/ApiError.js'

export default {
  name: 'createFollowUp',
  description: 'Schedule a follow-up reminder for a lead.',
  parameters: {
    type: 'object',
    properties: {
      leadId: { type: 'string', description: 'ID of the lead' },
      title: { type: 'string', description: 'Short title for the follow-up' },
      dueDate: {
        type: 'string',
        description: 'Due date as an ISO 8601 date, e.g. 2026-09-01',
      },
    },
    required: ['leadId', 'title', 'dueDate'],
  },
  async run(params, { userId }) {
    if (params.title.length > 200) {
      throw new ApiError(400, 'Follow-up title is too long (max 200 characters)')
    }

    const dueDate = new Date(params.dueDate)
    if (Number.isNaN(dueDate.getTime())) {
      throw new ApiError(400, 'dueDate must be a valid date')
    }

    const lead = await findOwnedLead(params.leadId, userId)

    const followUp = await FollowUp.create({
      user: userId,
      lead: lead._id,
      title: params.title,
      dueDate,
    })

    await recordActivity({
      userId,
      leadId: lead._id,
      type: 'followup_created',
      message: `Follow-up scheduled via AI: ${params.title}`,
      metadata: { title: params.title, dueDate: dueDate.toISOString(), actor: 'ai' },
    })

    return {
      followUpId: followUp._id.toString(),
      leadId: lead._id.toString(),
      title: params.title,
      dueDate: dueDate.toISOString(),
    }
  },
}