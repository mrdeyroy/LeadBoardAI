import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 50, default: '' },
    jobTitle: { type: String, trim: true, maxlength: 100, default: '' },
    companyName: { type: String, trim: true, maxlength: 100, default: '' },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    preferences: {
      itemsPerPage: { type: Number, default: 20 },
      defaultView: { type: String, enum: ['table', 'cards'], default: 'table' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    aiUsageCount: {
      type: Number,
      default: 0,
    },
    aiUsageResetDate: {
      type: Date,
      default: Date.now,
    },
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  { timestamps: true }
)

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

const User = mongoose.model('User', userSchema)

export default User