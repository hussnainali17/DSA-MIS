import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const eventSignupSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventName: { type: String, required: true, trim: true, maxlength: 200 },
    // Student details (copy at time of submission)
    name: { type: String, required: true, trim: true, maxlength: 200 },
    regNo: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    department: { type: String, required: true, trim: true, maxlength: 200 },
    programme: { type: String, enum: ['BS', 'MA / MSc', 'MPhil', 'PhD'], required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    role: {
      type: String,
      enum: ['Participant', 'Team member', 'Volunteer'],
      required: true,
    },
    category: { type: String, trim: true, maxlength: 200, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Declined'],
      default: 'Pending',
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON }
)

eventSignupSchema.index({ event: 1, regNo: 1 }, { unique: true })

export default mongoose.model('EventSignup', eventSignupSchema)
