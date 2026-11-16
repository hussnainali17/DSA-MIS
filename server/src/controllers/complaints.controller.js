import Complaint from '../models/Complaint.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, forbidden } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/complaints
export const listComplaints = asyncHandler(async (req, res) => {
  const { status, category, q, page = 1, limit = 50 } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50))
  const skip = (pageNum - 1) * limitNum

  const filter = {}
  if (status) filter.status = status
  if (category) filter.category = category
  if (q) {
    filter.$or = [
      { ref: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
      { regNo: { $regex: q, $options: 'i' } },
      { subject: { $regex: q, $options: 'i' } },
    ]
  }

  const [items, total] = await Promise.all([
    Complaint.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).select('-history -details').lean(),
    Complaint.countDocuments(filter),
  ])

  res.json({ ok: true, items, total, page: pageNum, limit: limitNum })
})

// GET /api/admin/complaints/:id  — full record with history
export const getComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).lean()
  if (!complaint) throw notFound('Complaint not found.')
  res.json({ ok: true, complaint })
})

// PATCH /api/admin/complaints/:id
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
  if (!complaint) throw notFound('Complaint not found.')

  const { status: newStatus, response: newResponse } = req.body
  const now = new Date()

  let changed = false
  const historyEntry = {
    at: now,
    by: req.admin.name,
    status: complaint.status,
    response: complaint.response,
  }

  // Auto-promote New → In review when a response is added
  if (newStatus !== undefined) {
    if (complaint.status !== newStatus) {
      complaint.status = newStatus
      historyEntry.status = newStatus
      changed = true
    }
  }
  if (newResponse !== undefined) {
    const trimmed = newResponse.trim()
    if (trimmed && trimmed !== complaint.response) {
      complaint.response = trimmed
      complaint.respondedBy = req.admin.name
      complaint.respondedAt = now
      historyEntry.response = trimmed
      changed = true
      // Auto-promote if still New
      if (complaint.status === 'New') {
        complaint.status = 'In review'
        historyEntry.status = 'In review'
      }
    }
  }

  if (changed) {
    complaint.history.push(historyEntry)
    await complaint.save()
    await AuditLog.create({
      admin: req.admin._id,
      adminName: req.admin.name,
      action: 'complaint.respond',
      target: complaint.id,
      meta: { ref: complaint.ref, status: complaint.status },
      ip: req.ip,
    })
  }

  res.json({ ok: true, complaint: complaint.toJSON() })
})

// DELETE /api/admin/complaints/:id  — superadmin only
export const deleteComplaint = asyncHandler(async (req, res) => {
  if (req.admin.role !== 'superadmin') throw forbidden('Superadmin access required.')
  const complaint = await Complaint.findById(req.params.id)
  if (!complaint) throw notFound('Complaint not found.')
  await Complaint.deleteOne({ _id: complaint._id })
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'complaint.delete',
    target: complaint.id,
    meta: { ref: complaint.ref },
    ip: req.ip,
  })
  res.json({ ok: true })
})
