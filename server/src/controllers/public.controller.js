import Event from '../models/Event.js'
import Society from '../models/Society.js'
import EventSignup from '../models/EventSignup.js'
import SocietyApplication from '../models/SocietyApplication.js'
import Complaint from '../models/Complaint.js'
import { nextComplaintRef } from '../utils/counters.js'
import { conflict, notFound } from '../utils/apiError.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/public/events
export const getPublicEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ published: true }).sort({ start: 1 }).lean({ virtuals: true })
  // Events without a start date go last
  const withDate = events.filter((e) => e.start)
  const withoutDate = events.filter((e) => !e.start)
  res.json({ ok: true, items: [...withDate, ...withoutDate] })
})

// GET /api/public/societies
export const getPublicSocieties = asyncHandler(async (req, res) => {
  const societies = await Society.find().select('id slug name about').lean()
  res.json({ ok: true, items: societies })
})

// POST /api/public/event-signups
export const createEventSignup = asyncHandler(async (req, res) => {
  const data = req.body
  // Honeypot check — silently accept but don't save
  if (data.website) return res.status(201).json({ ok: true })

  const event = await Event.findById(data.eventId)
  if (!event || !event.published) throw notFound('Event not found or not available.')

  try {
    const signup = await EventSignup.create({
      event: event._id,
      eventName: event.name,
      name: data.name,
      regNo: data.regNo,
      department: data.department,
      programme: data.programme,
      semester: data.semester,
      email: data.email,
      phone: data.phone,
      role: data.role,
      category: data.category || '',
    })
    res.status(201).json({ ok: true, id: signup.id })
  } catch (err) {
    if (err.code === 11000) throw conflict('This registration number is already registered for this event.')
    throw err
  }
})

// POST /api/public/society-applications
export const createSocietyApplication = asyncHandler(async (req, res) => {
  const data = req.body
  // Honeypot check
  if (data.website) return res.status(201).json({ ok: true })

  let society
  if (data.societyId) {
    society = await Society.findById(data.societyId)
  } else if (data.societySlug) {
    society = await Society.findOne({ slug: data.societySlug })
  }
  if (!society) throw notFound('Society not found.')

  try {
    await SocietyApplication.create({
      society: society._id,
      societyName: society.name,
      name: data.name,
      regNo: data.regNo,
      department: data.department,
      programme: data.programme,
      semester: data.semester,
      email: data.email,
      phone: data.phone,
      applyingAs: data.applyingAs,
      position: data.position || '',
      experience: data.experience || '',
    })
    res.status(201).json({ ok: true })
  } catch (err) {
    if (err.code === 11000) throw conflict('This registration number has already applied to this society.')
    throw err
  }
})

// POST /api/public/complaints
export const createComplaint = asyncHandler(async (req, res) => {
  const data = req.body
  // Honeypot check
  if (data.website) return res.status(201).json({ ok: true, ref: 'CMP-0000-0000' })

  const ref = await nextComplaintRef()
  await Complaint.create({
    ref,
    name: data.name,
    regNo: data.regNo,
    department: data.department,
    programme: data.programme,
    semester: data.semester,
    email: data.email,
    phone: data.phone,
    category: data.category,
    incidentDate: data.incidentDate || null,
    against: data.against || '',
    subject: data.subject,
    details: data.details,
  })
  res.status(201).json({ ok: true, ref })
})

// POST /api/public/complaints/track
export const trackComplaint = asyncHandler(async (req, res) => {
  const { ref, regNo } = req.body
  const complaint = await Complaint.findOne({
    ref: ref.toUpperCase(),
    regNo: regNo.toUpperCase(),
  }).select('ref status subject createdAt response respondedAt')

  if (!complaint) {
    throw notFound('No complaint matches that reference number and registration number.')
  }

  // Return ONLY the safe fields — never phone, email, details, or history
  res.json({
    ok: true,
    complaint: {
      ref: complaint.ref,
      status: complaint.status,
      subject: complaint.subject,
      createdAt: complaint.createdAt,
      response: complaint.response,
      respondedAt: complaint.respondedAt,
    },
  })
})
