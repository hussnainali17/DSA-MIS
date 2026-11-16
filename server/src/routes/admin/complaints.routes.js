import { Router } from 'express'
import { listComplaints, getComplaint, updateComplaint, deleteComplaint } from '../../controllers/complaints.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { complaintAdminPatchSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listComplaints)
router.get('/:id', validateObjectId('id'), getComplaint)
router.patch('/:id', validateObjectId('id'), validate(complaintAdminPatchSchema), updateComplaint)
router.delete('/:id', validateObjectId('id'), deleteComplaint)

export default router
