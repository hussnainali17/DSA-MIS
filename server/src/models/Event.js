import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    society: { type: String, trim: true, maxlength: 200, default: 'DSA' },
    level: {
      type: String,
      enum: ['University', 'Inter-university', 'National'],
      default: 'University',
    },
    start: { type: Date, default: null },
    end: { type: Date, default: null },
    dateLabel: { type: String, trim: true, maxlength: 100, default: '' },
    venue: { type: String, trim: true, maxlength: 300, default: '' },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    published: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON,
    toObject: { virtuals: true },
  }
)

// Validate end >= start when both are provided
eventSchema.pre('validate', function () {
  if (this.start && this.end && this.end < this.start) {
    this.invalidate('end', 'End date must be on or after start date')
  }
})

// Virtual: human-readable date range
eventSchema.virtual('displayDate').get(function () {
  if (this.dateLabel) return this.dateLabel
  if (!this.start) return ''
  const fmt = (d) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  if (!this.end || this.start.getTime() === this.end.getTime()) return fmt(this.start)
  return `${fmt(this.start)} – ${fmt(this.end)}`
})

export default mongoose.model('Event', eventSchema)
