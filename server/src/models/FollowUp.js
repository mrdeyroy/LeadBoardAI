import mongoose from 'mongoose'

const followUpSchema = new mongoose.Schema(
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
    title: { type: String, required: true, trim: true, maxlength: 200 },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
)

followUpSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    return ret
  },
})

const FollowUp = mongoose.model('FollowUp', followUpSchema)

export default FollowUp