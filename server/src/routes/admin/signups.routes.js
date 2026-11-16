import { Router } from 'express'
import { listEventSignups, updateSignupStatus, approveSignup, deleteSignup } from '../../controllers/signups.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { signupStatusSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listEventSignups)
router.patch('/:id/status', validateObjectId('id'), validate(signupStatusSchema), updateSignupStatus)
router.post('/:id/approve', validateObjectId('id'), approveSignup)
router.delete('/:id', validateObjectId('id'), deleteSignup)

export default router
