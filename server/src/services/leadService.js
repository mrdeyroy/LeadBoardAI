import mongoose from 'mongoose'

import Lead from '../models/Lead.js'
import { ApiError } from '../utils/ApiError.js'

/** Find a lead owned by the given user, used by controllers and AI tools. */
export async function findOwnedLead(leadId, userId) {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new ApiError(404, 'Lead not found')
  }
  const lead = await Lead.findOne({ _id: leadId, user: userId })
  if (!lead) {
    throw new ApiError(404, 'Lead not found')
  }
  return lead
}