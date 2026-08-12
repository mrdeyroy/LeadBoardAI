import mongoose from 'mongoose'

export const LEAD_STATUSES = [
  'New',
  'Researched',
  'Contacted',
  'Replied',
  'Qualified',
  'Meeting',
  'Proposal',
  'Won',
  'Lost',
]

export const WEBSITE_STATUSES = [
  'No Website',
  'Outdated Website',
  'Good Website',
  'Redesign Opportunity',
]

export const OUTREACH_CHANNELS = [
  'Cold Email',
  'Phone',
  'WhatsApp',
  'Instagram',
  'Referral',
  'Other',
]

export const LEAD_UPDATE_FIELDS = [
  'name',
  'company',
  'email',
  'phone',
  'source',
  'requirement',
  'budget',
  'timeline',
  'status',
  'notes',
  'contactPerson',
  'website',
  'industry',
  'websiteStatus',
  'outreachChannel',
  'lastContactedAt',
  'nextFollowUpAt',
]

const leadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, trim: true, maxlength: 200, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 50, default: '' },
    source: { type: String, trim: true, maxlength: 100, default: '' },
    requirement: { type: String, trim: true, maxlength: 2000, default: '' },
    budget: { type: String, trim: true, maxlength: 100, default: '' },
    timeline: { type: String, trim: true, maxlength: 100, default: '' },
    status: { type: String, enum: LEAD_STATUSES, default: 'New', index: true },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },
    contactPerson: { type: String, trim: true, maxlength: 200, default: '' },
    website: { type: String, trim: true, maxlength: 500, default: '' },
    industry: { type: String, trim: true, maxlength: 100, default: '' },
    websiteStatus: { type: String, enum: WEBSITE_STATUSES, default: 'No Website', index: true },
    outreachChannel: { type: String, enum: OUTREACH_CHANNELS, default: 'Cold Email', index: true },
    lastContactedAt: { type: Date, default: null },
    nextFollowUpAt: { type: Date, default: null },
  },
  { timestamps: true }
)

leadSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

const Lead = mongoose.model('Lead', leadSchema)

export default Lead