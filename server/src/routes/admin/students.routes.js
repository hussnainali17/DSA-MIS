import { Router } from 'express'
import { listStudents, createStudent, updateStudent, deleteStudent } from '../../controllers/students.controller.js'
import { validate, validateObjectId } from '../../middleware/validate.js'
import { studentAdminSchema, patchStudentSchema } from '../../validators/schemas.js'

const router = Router()
router.get('/', listStudents)
router.post('/', validate(studentAdminSchema), createStudent)
router.patch('/:id', validateObjectId('id'), validate(patchStudentSchema), updateStudent)
router.delete('/:id', validateObjectId('id'), deleteStudent)

export default router
