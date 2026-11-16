import mongoose from 'mongoose'

const toJSON = {
  transform(doc, ret) {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
}

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    adminName: { type: String, trim: true, maxlength: 120 },
    action: { type: String, required: true, trim: true, maxlength: 100 },
    target: { type: String, trim: true, maxlength: 100, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true, maxlength: 50, default: '' },
  },
  { timestamps: true, toJSON }
)

export default mongoose.model('AuditLog', auditLogSchema)
