import Event from '../models/Event.js'
import Registration from '../models/Registration.js'
import Student from '../models/Student.js'
import EventSignup from '../models/EventSignup.js'
import SocietyApplication from '../models/SocietyApplication.js'
import Complaint from '../models/Complaint.js'
import asyncHandler from '../utils/asyncHandler.js'

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [events, students, registrations, pendingSignups, pendingApplications, newComplaints, latestEvents] =
    await Promise.all([
      Event.countDocuments(),
      Student.countDocuments(),
      Registration.countDocuments(),
      EventSignup.countDocuments({ status: 'Pending' }),
      SocietyApplication.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'New' }),
      Event.find().sort({ createdAt: -1 }).limit(5).lean({ virtuals: true }),
    ])

  res.json({
    ok: true,
    stats: { events, students, registrations, pendingSignups, pendingApplications, newComplaints },
    latestEvents,
  })
})
