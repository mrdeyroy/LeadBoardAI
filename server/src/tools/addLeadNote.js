import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'
import { ApiError } from '../utils/ApiError.js'

export default {
  name: 'addLeadNote',
  description: 'Add or replace the working notes on a lead.',
  parameters: {
    type: 'object',
    properties: {
      leadId: { type: 'string', description: 'ID of the lead' },
      content: { type: 'string', description: 'The note text to store' },
    },
    required: ['leadId', 'content'],
  },
  async run(params, { userId }) {
    if (params.content.length > 5000) {
      throw new ApiError(400, 'Note content is too long (max 5000 characters)')
    }

    const lead = await findOwnedLead(params.leadId, userId)
    const previous = lead.notes

    lead.notes = params.content
    await lead.save()

    await recordActivity({
      userId,
      leadId: lead._id,
      type: 'note_added',
      message: 'Note added via AI',
      metadata: { note: params.content.slice(0, 200), actor: 'ai' },
    })

    return {
      leadId: lead._id.toString(),
      note: params.content,
      updated: previous !== params.content,
    }
  },
}