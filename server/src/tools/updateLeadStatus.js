import { LEAD_STATUSES } from '../models/Lead.js'
import { recordActivity } from '../services/activityService.js'
import { findOwnedLead } from '../services/leadService.js'

export default {
  name: 'updateLeadStatus',
  description: 'Change the status of a lead.',
  parameters: {
    type: 'object',
    properties: {
      leadId: { type: 'string', description: 'ID of the lead' },
      status: {
        type: 'string',
        enum: LEAD_STATUSES,
        description: 'New status for the lead',
      },
    },
    required: ['leadId', 'status'],
  },
  async run(params, { userId }) {
    const lead = await findOwnedLead(params.leadId, userId)
    const from = lead.status

    if (from === params.status) {
      return { changed: false, message: `Lead is already ${params.status}` }
    }

    lead.status = params.status
    await lead.save()

    await recordActivity({
      userId,
      leadId: lead._id,
      type: 'status_changed',
      message: `AI updated status ${from} → ${params.status}`,
      metadata: { from, to: params.status, actor: 'ai' },
    })

    return {
      changed: true,
      leadId: lead._id.toString(),
      from,
      to: params.status,
    }
  },
}