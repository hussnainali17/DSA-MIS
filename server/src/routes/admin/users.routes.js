import { Router } from 'express'
import { listUsers, createUser, updateUser, deleteUser } from '../../controllers/users.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { createUserSchema, patchUserSchema } from '../../validators/schemas.js'
import { requireSuperadmin } from '../../middleware/auth.js'

const router = Router()
// All user management requires superadmin
router.use(requireSuperadmin)
router.get('/', listUsers)
router.post('/', validate(createUserSchema), createUser)
router.patch('/:id', validateObjectId('id'), validate(patchUserSchema), updateUser)
router.delete('/:id', validateObjectId('id'), deleteUser)

export default router
