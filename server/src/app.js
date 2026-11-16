import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import mongoSanitize from 'express-mongo-sanitize'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import env from './config/env.js'
import publicRoutes from './routes/public.routes.js'
import authRoutes from './routes/auth.routes.js'
import statsRoutes from './routes/admin/stats.routes.js'
import eventsRoutes from './routes/admin/events.routes.js'
import studentsRoutes from './routes/admin/students.routes.js'
import registrationsRoutes from './routes/admin/registrations.routes.js'
import signupsRoutes from './routes/admin/signups.routes.js'
import applicationsRoutes from './routes/admin/applications.routes.js'
import complaintsRoutes from './routes/admin/complaints.routes.js'
import usersRoutes from './routes/admin/users.routes.js'
import { requireAdmin } from './middleware/auth.js'
import errorHandler from './middleware/errorHandler.js'
import notFound from './middleware/notFound.js'

const app = express()

// ── Security ──
app.use(helmet())
app.use(hpp())
app.use(mongoSanitize({ replaceWith: '_', allowDots: true }))

// ── CORS ──
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
)

// ── Body parsing ──
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())

// ── Logging ──
// Skip logging request bodies for complaint endpoints (sensitive)
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan('short', {
      skip: (req) => req.path.startsWith('/api/public/complaints'),
    })
  )
}

// ── Health ──
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }))

// ── Public routes (no auth) ──
app.use('/api/public', publicRoutes)

// ── Auth routes ──
app.use('/api/admin/auth', authRoutes)

// ── Admin routes (all require valid admin cookie) ──
app.use('/api/admin/stats', requireAdmin, statsRoutes)
app.use('/api/admin/events', requireAdmin, eventsRoutes)
app.use('/api/admin/students', requireAdmin, studentsRoutes)
app.use('/api/admin/registrations', requireAdmin, registrationsRoutes)
app.use('/api/admin/event-signups', requireAdmin, signupsRoutes)
app.use('/api/admin/society-applications', requireAdmin, applicationsRoutes)
app.use('/api/admin/complaints', requireAdmin, complaintsRoutes)
app.use('/api/admin/users', requireAdmin, usersRoutes)

// ── 404 and Error handling ──
app.use(notFound)
app.use(errorHandler)

export default app
