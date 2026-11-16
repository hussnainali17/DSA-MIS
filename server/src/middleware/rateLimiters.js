import rateLimit from 'express-rate-limit'
import env from '../config/env.js'

const json429 = (req, res) =>
  res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' })

// In test mode, use very high limits so tests don't trip over themselves
const testMax = 10000

/**
 * Rate limiter for public submission endpoints.
 * 10 submissions per IP per 15 minutes (disabled in test).
 */
export const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? testMax : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})

/**
 * Rate limiter for complaint tracking.
 * 20 per IP per 15 minutes (disabled in test).
 */
export const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? testMax : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})

/**
 * Rate limiter for admin login.
 * 10 per IP per 15 minutes (disabled in test).
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? testMax : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
})
