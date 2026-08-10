import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

userSchema.pre('save', function preSave() {
  if (!this.isModified('passwordHash')) return
  return bcrypt.hash(this.passwordHash, 10).then((hash) => {
    this.passwordHash = hash
  })
})

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.passwordHash
    return ret
  },
})

const User = mongoose.model('User', userSchema)

export default User