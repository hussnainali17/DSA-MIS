import SocietyApplication from '../models/SocietyApplication.js'
import AuditLog from '../models/AuditLog.js'
import { notFound } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/society-applications
export const listApplications = asyncHandler(async (req, res) => {
  const { status, societyId, page = 1, limit = 50 } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50))
  const skip = (pageNum - 1) * limitNum

  const filter = {}
  if (status) filter.status = status
  if (societyId) filter.society = societyId

  const [items, total] = await Promise.all([
    SocietyApplication.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    SocietyApplication.countDocuments(filter),
  ])

  res.json({ ok: true, items, total, page: pageNum, limit: limitNum })
})

// PATCH /api/admin/society-applications/:id/status
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const app = await SocietyApplication.findById(req.params.id)
  if (!app) throw notFound('Society application not found.')
  app.status = req.body.status
  app.reviewedBy = req.admin._id
  app.reviewedAt = new Date()
  await app.save()
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: `application.${req.body.status.toLowerCase()}`,
    target: app.id,
    meta: { regNo: app.regNo, status: req.body.status },
    ip: req.ip,
  })
  res.json({ ok: true, application: app.toJSON() })
})

// DELETE /api/admin/society-applications/:id
export const deleteApplication = asyncHandler(async (req, res) => {
  const app = await SocietyApplication.findById(req.params.id)
  if (!app) throw notFound('Society application not found.')
  await SocietyApplication.deleteOne({ _id: app._id })
  res.json({ ok: true })
})
