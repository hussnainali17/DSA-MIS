import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    regNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
    department: { type: String, required: true, trim: true, maxlength: 200 },
    programme: {
      type: String,
      enum: ['BS', 'MA / MSc', 'MPhil', 'PhD'],
      required: true,
    },
    semester: { type: Number, required: true, min: 1, max: 12 },
    email: { type: String, trim: true, lowercase: true, maxlength: 200, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
  },
  { timestamps: true, toJSON }
)

export default mongoose.model('Student', studentSchema)
