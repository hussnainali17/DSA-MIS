import { Router } from 'express'
import {
  getPublicEvents,
  getPublicSocieties,
  createEventSignup,
  createSocietyApplication,
  createComplaint,
  trackComplaint,
} from '../controllers/public.controller.js'
import { validate } from '../middleware/validate.js'
import {
  eventSignupSchema,
  societyApplicationSchema,
  complaintSchema,
  trackComplaintSchema,
} from '../validators/schemas.js'
import { publicSubmitLimiter, trackLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.get('/events', getPublicEvents)
router.get('/societies', getPublicSocieties)

router.post('/event-signups', publicSubmitLimiter, validate(eventSignupSchema), createEventSignup)
router.post('/society-applications', publicSubmitLimiter, validate(societyApplicationSchema), createSocietyApplication)
router.post('/complaints', publicSubmitLimiter, validate(complaintSchema), createComplaint)
router.post('/complaints/track', trackLimiter, validate(trackComplaintSchema), trackComplaint)

export default router
