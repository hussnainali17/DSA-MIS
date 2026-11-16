import { Router } from 'express'
import { login, logout, me } from '../controllers/auth.controller.js'
import { requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginSchema } from '../validators/schemas.js'
import { loginLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', requireAdmin, me)

export default router
