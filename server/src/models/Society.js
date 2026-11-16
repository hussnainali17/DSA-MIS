import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const societySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    about: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true, toJSON }
)

export default mongoose.model('Society', societySchema)
