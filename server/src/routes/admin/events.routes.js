import { Router } from 'express'
import { listEvents, createEvent, updateEvent, deleteEvent } from '../../controllers/events.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { eventSchema, patchEventSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listEvents)
router.post('/', validate(eventSchema), createEvent)
router.patch('/:id', validateObjectId('id'), validate(patchEventSchema), updateEvent)
router.delete('/:id', validateObjectId('id'), deleteEvent)

export default router
