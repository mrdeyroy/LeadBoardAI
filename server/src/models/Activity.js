import mongoose from 'mongoose'

export const ACTIVITY_TYPES = [
  'lead_created',
  'status_changed',
  'note_added',
  'ai_analysis',
  'followup_created',
  'ai_action',
  'website_status_changed',
  'outreach_channel_changed',
  'next_followup_updated',
]

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 400 },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

activitySchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    if (ret.metadata instanceof Map) {
      ret.metadata = Object.fromEntries(ret.metadata)
    }
    return ret
  },
})

const Activity = mongoose.model('Activity', activitySchema)

export default Activity