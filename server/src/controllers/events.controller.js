import Event from '../models/Event.js'
import Registration from '../models/Registration.js'
import AuditLog from '../models/AuditLog.js'
import { notFound, conflict } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/events
export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 }).lean({ virtuals: true })
  // Add registrationCount to each event
  const counts = await Registration.aggregate([
    { $group: { _id: '$event', count: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]))
  const items = events.map((e) => ({ ...e, registrationCount: countMap[e._id?.toString() || e.id] || 0 }))
  res.json({ ok: true, items })
})

// POST /api/admin/events
export const createEvent = asyncHandler(async (req, res) => {
  const event = await Event.create(req.body)
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'event.create',
    target: event.id,
    meta: { name: event.name },
    ip: req.ip,
  })
  res.status(201).json({ ok: true, event: event.toJSON() })
})

// PATCH /api/admin/events/:id
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) throw notFound('Event not found.')
  Object.assign(event, req.body)
  await event.save()
  res.json({ ok: true, event: event.toJSON() })
})

// DELETE /api/admin/events/:id
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) throw notFound('Event not found.')
  await Registration.deleteMany({ event: event._id })
  await Event.deleteOne({ _id: event._id })
  await AuditLog.create({
    admin: req.admin._id,
    adminName: req.admin.name,
    action: 'event.delete',
    target: event.id,
    meta: { name: event.name },
    ip: req.ip,
  })
  res.json({ ok: true })
})
