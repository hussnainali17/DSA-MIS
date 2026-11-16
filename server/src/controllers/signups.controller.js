import EventSignup from '../models/EventSignup.js'
import Student from '../models/Student.js'
import Registration from '../models/Registration.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, conflict } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/event-signups
export const listEventSignups = asyncHandler(async (req, res) => {
  const { status, eventId, page = 1, limit = 50 } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50))
  const skip = (pageNum - 1) * limitNum

  const filter = {}
  if (status) filter.status = status
  if (eventId) filter.event = eventId

  const [items, total] = await Promise.all([
    EventSignup.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    EventSignup.countDocuments(filter),
  ])

  res.json({ ok: true, items, total, page: pageNum, limit: limitNum })
})

// PATCH /api/admin/event-signups/:id/status
export const updateSignupStatus = asyncHandler(async (req, res) => {
  const signup = await EventSignup.findById(req.params.id)
  if (!signup) throw notFound('Event signup not found.')
  signup.status = req.body.status
  signup.reviewedBy = req.admin._id
  signup.reviewedAt = new Date()
  await signup.save()
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: `signup.${req.body.status.toLowerCase()}`,
    target: signup.id,
    meta: { regNo: signup.regNo, status: req.body.status },
    ip: req.ip,
  })
  res.json({ ok: true, signup: signup.toJSON() })
})

// POST /api/admin/event-signups/:id/approve
// Idempotent: sets Approved, upserts Student, upserts Registration
export const approveSignup = asyncHandler(async (req, res) => {
  const signup = await EventSignup.findById(req.params.id)
  if (!signup) throw notFound('Event signup not found.')

  // Set approved status
  signup.status = 'Approved'
  signup.reviewedBy = req.admin._id
  signup.reviewedAt = new Date()
  await signup.save()

  // Upsert student by regNo (update details if already exists)
  const student = await Student.findOneAndUpdate(
    { regNo: signup.regNo },
    {
      $set: {
        name: signup.name,
        department: signup.department,
        programme: signup.programme,
        semester: signup.semester,
        email: signup.email,
        phone: signup.phone,
      },
      $setOnInsert: { regNo: signup.regNo },
    },
    { upsert: true, new: true }
  )

  // Upsert registration (idempotent — won't duplicate)
  let registration
  try {
    registration = await Registration.create({
      event: signup.event,
      student: student._id,
      role: signup.role === 'Team member' ? 'Team member' : signup.role,
      category: signup.category || '',
      registeredBy: req.admin._id,
    })
  } catch (err) {
    if (err.code !== 11000) throw err
    // Already exists — fetch the existing one
    registration = await Registration.findOne({ event: signup.event, student: student._id })
  }

  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'signup.approve',
    target: signup.id,
    meta: { regNo: signup.regNo, studentId: student.id },
    ip: req.ip,
  })

  res.json({ ok: true, signup: signup.toJSON(), student: student.toJSON(), registration: registration?.toJSON() })
})

// DELETE /api/admin/event-signups/:id
export const deleteSignup = asyncHandler(async (req, res) => {
  const signup = await EventSignup.findById(req.params.id)
  if (!signup) throw notFound('Event signup not found.')
  await EventSignup.deleteOne({ _id: signup._id })
  res.json({ ok: true })
})
