import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const historyEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: String, trim: true, maxlength: 120 },
    status: { type: String, maxlength: 40 },
    response: { type: String, maxlength: 5000, default: '' },
  },
  { _id: false }
)

const complaintSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, trim: true, maxlength: 30 },
    // Student details
    name: { type: String, required: true, trim: true, maxlength: 200 },
    regNo: { type: String, required: true, trim: true, uppercase: true, maxlength: 40 },
    department: { type: String, required: true, trim: true, maxlength: 200 },
    programme: { type: String, enum: ['BS', 'MA / MSc', 'MPhil', 'PhD'], required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    category: {
      type: String,
      required: true,
      enum: [
        'Society or cabinet matter',
        'Event or competition',
        'Attendance or sessional recommendation',
        'Conduct of a student or staff member',
        'Harassment or misconduct',
        'Facilities, transport or logistics',
        'Other',
      ],
    },
    incidentDate: { type: Date, default: null },
    against: { type: String, trim: true, maxlength: 300, default: '' },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    details: { type: String, required: true, trim: true, minlength: 20, maxlength: 5000 },
    status: {
      type: String,
      enum: ['New', 'In review', 'Resolved', 'Closed'],
      default: 'New',
    },
    response: { type: String, trim: true, maxlength: 5000, default: '' },
    respondedBy: { type: String, trim: true, maxlength: 120, default: '' },
    respondedAt: { type: Date, default: null },
    history: { type: [historyEntrySchema], default: [] },
  },
  { timestamps: true, toJSON }
)

export default mongoose.model('Complaint', complaintSchema)
