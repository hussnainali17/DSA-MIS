import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    role: {
      type: String,
      enum: ['Participant', 'Team member', 'Team lead', 'Volunteer'],
      required: true,
    },
    category: { type: String, trim: true, maxlength: 200, default: '' },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
  },
  { timestamps: true, toJSON }
)

registrationSchema.index({ event: 1, student: 1 }, { unique: true })

export default mongoose.model('Registration', registrationSchema)
