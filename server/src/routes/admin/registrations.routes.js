import { Router } from 'express'
import { listRegistrations, createRegistration, deleteRegistration } from '../../controllers/registrations.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { registrationSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listRegistrations)
router.post('/', validate(registrationSchema), createRegistration)
router.delete('/:id', validateObjectId('id'), deleteRegistration)

export default router
