import Registration from '../models/Registration.js'
import Event from '../models/Event.js'
import Student from '../models/Student.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, conflict, badRequest } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/registrations?eventId=
export const listRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.query
  const filter = eventId ? { event: eventId } : {}
  const items = await Registration.find(filter)
    .populate('student', 'name regNo department programme semester email phone')
    .populate('event', 'name')
    .sort({ createdAt: -1 })
    .lean()
  res.json({ ok: true, items })
})

// POST /api/admin/registrations
export const createRegistration = asyncHandler(async (req, res) => {
  const { eventId, studentId, role, category } = req.body
  const [event, student] = await Promise.all([Event.findById(eventId), Student.findById(studentId)])
  if (!event) throw notFound('Event not found.')
  if (!student) throw notFound('Student not found.')

  try {
    const reg = await Registration.create({
      event: event._id,
      student: student._id,
      role,
      category: category || '',
      registeredBy: req.admin._id,
    })
    await AuditLog.create({
      admin: req.admin._id,
      adminName: req.admin.name,
      action: 'registration.create',
      target: reg.id,
      meta: { event: event.name, student: student.name, regNo: student.regNo },
      ip: req.ip,
    })
    res.status(201).json({ ok: true, registration: reg.toJSON() })
  } catch (err) {
    if (err.code === 11000) throw conflict('This student is already registered for the event.')
    throw err
  }
})

// DELETE /api/admin/registrations/:id
export const deleteRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id)
  if (!reg) throw notFound('Registration not found.')
  await Registration.deleteOne({ _id: reg._id })
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'registration.delete',
    target: reg.id,
    ip: req.ip,
  })
  res.json({ ok: true })
})
