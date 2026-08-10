import mongoose from 'mongoose'

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Won',
  'Lost',
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