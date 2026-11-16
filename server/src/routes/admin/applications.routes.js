import { Router } from 'express'
import { listApplications, updateApplicationStatus, deleteApplication } from '../../controllers/applications.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { signupStatusSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listApplications)
router.patch('/:id/status', validateObjectId('id'), validate(signupStatusSchema), updateApplicationStatus)
router.delete('/:id', validateObjectId('id'), deleteApplication)

export default router
