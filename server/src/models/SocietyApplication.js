import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const societyApplicationSchema = new mongoose.Schema(
  {
    society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
    societyName: { type: String, required: true, trim: true, maxlength: 200 },
    // Student details
    name: { type: String, required: true, trim: true, maxlength: 200 },
    regNo: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    department: { type: String, required: true, trim: true, maxlength: 200 },
    programme: { type: String, enum: ['BS', 'MA / MSc', 'MPhil', 'PhD'], required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    applyingAs: {
      type: String,
      enum: ['General member', 'Cabinet position'],
      required: true,
    },
    position: { type: String, trim: true, maxlength: 200, default: '' },
    experience: { type: String, trim: true, maxlength: 2000, default: '' },
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

societyApplicationSchema.index({ society: 1, regNo: 1 }, { unique: true })

export default mongoose.model('SocietyApplication', societyApplicationSchema)
